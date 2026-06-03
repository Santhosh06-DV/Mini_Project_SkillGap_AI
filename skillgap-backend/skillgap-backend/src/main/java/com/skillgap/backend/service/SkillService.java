package com.skillgap.backend.service;

import com.skillgap.backend.model.SkillRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SkillService {

    public String analyzeSkills(SkillRequest request){

        String pythonApi = "http://127.0.0.1:8000/analyze";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<SkillRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(pythonApi, entity, String.class);

        return response.getBody();
    }
}