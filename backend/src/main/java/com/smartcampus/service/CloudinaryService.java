package com.smartcampus.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.upload-preset:}")
    private String uploadPreset;

    public String uploadImage(MultipartFile file) throws IOException {
        Map<String, Object> uploadParams = new java.util.HashMap<>();
        uploadParams.put("resource_type", "auto");
        
        if (uploadPreset != null && !uploadPreset.isEmpty()) {
            uploadParams.put("upload_preset", uploadPreset);
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
        return uploadResult.get("secure_url").toString();
    }
}
