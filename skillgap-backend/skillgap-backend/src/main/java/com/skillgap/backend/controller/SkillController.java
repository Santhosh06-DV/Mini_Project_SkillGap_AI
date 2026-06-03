package com.skillgap.backend.controller;

import com.skillgap.backend.model.SkillRequest;
import com.skillgap.backend.service.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @PostMapping("/analyze")
    public String analyze(@RequestBody SkillRequest request){
        return skillService.analyzeSkills(request);
    }
}