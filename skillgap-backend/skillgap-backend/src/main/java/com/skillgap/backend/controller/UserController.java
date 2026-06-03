package com.skillgap.backend.controller;

import com.skillgap.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // ── Signup ──────────────────────
    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody Map<String, String> body) {
        return userService.signup(
            body.get("name"),
            body.get("email"),
            body.get("password")
        );
    }

    // ── Login ───────────────────────
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        return userService.login(
            body.get("email"),
            body.get("password")
        );
    }

    // ── Save Result ─────────────────
    @PostMapping("/save-result")
    public Map<String, Object> saveResult(@RequestBody Map<String, Object> body) {
        return userService.saveResult(
            Long.valueOf(body.get("userId").toString()),
            body.get("role").toString(),
            Double.valueOf(body.get("matchScore").toString()),
            body.get("matchedSkills").toString(),
            body.get("missingSkills").toString()
        );
    }

    // ── Delete Account ──────────────
    @DeleteMapping("/{userId}")
    public Map<String, Object> deleteAccount(@PathVariable Long userId) {
        return userService.deleteAccount(userId);
    }
}