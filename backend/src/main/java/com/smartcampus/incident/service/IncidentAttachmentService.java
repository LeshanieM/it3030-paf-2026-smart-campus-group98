package com.smartcampus.incident.service;

import com.smartcampus.incident.dto.IncidentResponses.AttachmentResponse;
import com.smartcampus.incident.exception.IncidentExceptions.InvalidRequestException;
import com.smartcampus.incident.exception.IncidentExceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class IncidentAttachmentService {

    private static final String METADATA_SEPARATOR = "::";
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path storageRoot;
    private final List<Path> readableRoots;

    public IncidentAttachmentService(
            @Value("${incident.attachments.storage-dir:uploads/incidents}") String storageDir
    ) {
        this.storageRoot = Paths.get(storageDir).toAbsolutePath().normalize();
        this.readableRoots = resolveReadableRoots(storageDir);
    }

    public List<String> storeAttachments(String incidentId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        createStorageDirectory();
        List<String> storedMetadata = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String originalFileName = sanitizeOriginalFileName(file.getOriginalFilename());
            validateFile(file, originalFileName);
            String attachmentId = UUID.randomUUID().toString();
            String storedFileName = buildStoredFileName(incidentId, attachmentId, originalFileName);
            Path targetPath = storageRoot.resolve(storedFileName).normalize();

            ensureWithinStorageRoot(targetPath, storageRoot);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException ex) {
                throw new InvalidRequestException("Failed to store attachment " + originalFileName);
            }

            storedMetadata.add(
                    serialize(
                            attachmentId,
                            originalFileName,
                            normalizeContentType(file.getContentType()),
                            storedFileName
                    )
            );
        }

        return storedMetadata;
    }

    public AttachmentResponse toResponse(String incidentId, String storedValue) {
        ParsedAttachment parsedAttachment = parse(storedValue);

        if (!parsedAttachment.isPersisted()) {
            return new AttachmentResponse(
                    null,
                    parsedAttachment.fileName(),
                    parsedAttachment.contentType(),
                    null,
                    null
            );
        }

        String baseUrl = "/incidents/" + incidentId + "/attachments/" + parsedAttachment.id();

        return new AttachmentResponse(
                parsedAttachment.id(),
                parsedAttachment.fileName(),
                parsedAttachment.contentType(),
                baseUrl,
                baseUrl + "?download=true"
        );
    }

    public StoredAttachment resolveStoredAttachment(List<String> storedValues, String attachmentId) {
        if (storedValues == null || storedValues.isEmpty()) {
            throw new ResourceNotFoundException("Attachment not found");
        }

        for (String storedValue : storedValues) {
            ParsedAttachment parsedAttachment = parse(storedValue);

            if (!parsedAttachment.isPersisted()) {
                continue;
            }

            if (!parsedAttachment.id().equals(attachmentId)) {
                continue;
            }

            Path resolvedPath = findExistingFile(parsedAttachment.storedFileName());

            if (resolvedPath == null) {
                throw new ResourceNotFoundException("Attachment file is missing");
            }

            String contentType = normalizeContentType(
                    parsedAttachment.contentType() != null && !parsedAttachment.contentType().isBlank()
                            ? parsedAttachment.contentType()
                            : detectContentType(parsedAttachment.fileName())
            );

            return new StoredAttachment(
                    resolvedPath,
                    parsedAttachment.fileName(),
                    contentType
            );
        }

        throw new ResourceNotFoundException("Attachment not found");
    }

    private void createStorageDirectory() {
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException ex) {
            throw new InvalidRequestException("Failed to initialize attachment storage");
        }
    }

    private String buildStoredFileName(String incidentId, String attachmentId, String originalFileName) {
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFileName.substring(dotIndex);
        }
        return incidentId + "-" + attachmentId + extension;
    }

    private String sanitizeOriginalFileName(String originalFileName) {
        String fallback = "attachment";

        if (originalFileName == null || originalFileName.isBlank()) {
            return fallback;
        }

        String sanitized = Path.of(originalFileName).getFileName().toString().trim();
        return sanitized.isEmpty() ? fallback : sanitized;
    }

    private String serialize(String id, String fileName, String contentType, String storedFileName) {
        return id
                + METADATA_SEPARATOR + encode(fileName)
                + METADATA_SEPARATOR + encode(contentType)
                + METADATA_SEPARATOR + encode(storedFileName);
    }

    private ParsedAttachment parse(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return new ParsedAttachment(null, "Attachment", "application/octet-stream", null, false);
        }

        String[] parts = storedValue.split(METADATA_SEPARATOR, 4);

        if (parts.length >= 4) {
            return new ParsedAttachment(
                    parts[0],
                    sanitizeOriginalFileName(decode(parts[1])),
                    normalizeContentType(decode(parts[2])),
                    Path.of(decode(parts[3])).getFileName().toString(),
                    true
            );
        }

        // Backward-compatible fallback for older/legacy stored values.
        // This at least keeps the attachment visible and allows resolution if the stored value
        // itself is the saved file name.
        String legacyStoredName = Path.of(storedValue).getFileName().toString();
        String syntheticId = UUID.nameUUIDFromBytes(legacyStoredName.getBytes(StandardCharsets.UTF_8)).toString();

        return new ParsedAttachment(
                syntheticId,
                sanitizeOriginalFileName(legacyStoredName),
                detectContentType(legacyStoredName),
                legacyStoredName,
                true
        );
    }

    private Path findExistingFile(String storedFileName) {
        if (storedFileName == null || storedFileName.isBlank()) {
            return null;
        }

        String normalizedFileName = Path.of(storedFileName).getFileName().toString();

        for (Path root : readableRoots) {
            Path candidate = root.resolve(normalizedFileName).normalize();

            try {
                ensureWithinStorageRoot(candidate, root);
            } catch (InvalidRequestException ex) {
                continue;
            }

            if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    private List<Path> resolveReadableRoots(String storageDir) {
        Set<Path> roots = new LinkedHashSet<>();

        Path configured = Paths.get(storageDir).toAbsolutePath().normalize();
        roots.add(configured);

        // Useful fallbacks when backend is run from different working directories
        roots.add(Paths.get("").toAbsolutePath().normalize().resolve("uploads/incidents").normalize());
        roots.add(Paths.get("").toAbsolutePath().normalize().resolve("backend/uploads/incidents").normalize());

        Path parent = Paths.get("").toAbsolutePath().normalize().getParent();
        if (parent != null) {
            roots.add(parent.resolve("uploads/incidents").normalize());
            roots.add(parent.resolve("backend/uploads/incidents").normalize());
        }

        return new ArrayList<>(roots);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String decode(String value) {
        return URLDecoder.decode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType.toLowerCase(Locale.ROOT);
    }

    private String detectContentType(String fileName) {
        String detected = URLConnection.guessContentTypeFromName(fileName);
        if (detected == null || detected.isBlank()) {
            return "application/octet-stream";
        }
        return normalizeContentType(detected);
    }

    private void ensureWithinStorageRoot(Path targetPath, Path root) {
        if (!targetPath.startsWith(root)) {
            throw new InvalidRequestException("Invalid attachment path");
        }
    }

    private void validateFile(MultipartFile file, String sanitizedFileName) {
        String fileName = sanitizedFileName.toLowerCase(Locale.ROOT);
        boolean hasValidExtension = ALLOWED_EXTENSIONS.stream().anyMatch(fileName::endsWith);

        if (!hasValidExtension) {
            throw new InvalidRequestException("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String normalizedType = contentType.toLowerCase(Locale.ROOT);
            if (!ALLOWED_MIME_TYPES.contains(normalizedType)) {
                throw new InvalidRequestException("Invalid file type for " + sanitizedFileName + ". Only images are allowed.");
            }
        }
    }

    public record StoredAttachment(Path path, String fileName, String contentType) {
    }

    private record ParsedAttachment(
            String id,
            String fileName,
            String contentType,
            String storedFileName,
            boolean isPersisted
    ) {
    }
}