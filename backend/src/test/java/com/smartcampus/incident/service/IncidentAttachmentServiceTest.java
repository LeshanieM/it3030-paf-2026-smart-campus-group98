package com.smartcampus.incident.service;

import com.smartcampus.incident.exception.IncidentExceptions.InvalidRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class IncidentAttachmentServiceTest {

    private IncidentAttachmentService attachmentService;

    @BeforeEach
    void setUp() {
        attachmentService = new IncidentAttachmentService("target/uploads");
    }

    @Test
    void acceptsValidImageFiles() {
        MultipartFile jpg = mockFile("test.jpg", "image/jpeg");
        MultipartFile png = mockFile("test.png", "image/png");
        MultipartFile webp = mockFile("test.webp", "image/webp");

        // Should not throw exception
        attachmentService.storeAttachments("inc-1", List.of(jpg, png, webp));
    }

    @Test
    void rejectsInvalidExtensions() {
        MultipartFile exe = mockFile("virus.exe", "application/x-msdownload");
        MultipartFile pdf = mockFile("document.pdf", "application/pdf");

        assertThatThrownBy(() -> attachmentService.storeAttachments("inc-1", List.of(exe)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");

        assertThatThrownBy(() -> attachmentService.storeAttachments("inc-1", List.of(pdf)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
    }

    @Test
    void rejectsInvalidMimeTypesEvenWithValidExtension() {
        MultipartFile fakeJpg = mockFile("fake.jpg", "text/plain");

        assertThatThrownBy(() -> attachmentService.storeAttachments("inc-1", List.of(fakeJpg)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Invalid file type for fake.jpg. Only images are allowed.");
    }

    @Test
    void rejectsDoubleExtensions() {
        MultipartFile doubleExt = mockFile("image.jpg.exe", "application/x-msdownload");

        assertThatThrownBy(() -> attachmentService.storeAttachments("inc-1", List.of(doubleExt)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
    }

    @Test
    void handlesMissingExtension() {
        MultipartFile noExt = mockFile("no-extension", "image/jpeg");

        assertThatThrownBy(() -> attachmentService.storeAttachments("inc-1", List.of(noExt)))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
    }

    private MultipartFile mockFile(String fileName, String contentType) {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn(fileName);
        when(file.getContentType()).thenReturn(contentType);
        when(file.isEmpty()).thenReturn(false);
        try {
            when(file.getInputStream()).thenReturn(new java.io.ByteArrayInputStream("fake image content".getBytes()));
        } catch (java.io.IOException e) {
            throw new RuntimeException(e);
        }
        return file;
    }
}
