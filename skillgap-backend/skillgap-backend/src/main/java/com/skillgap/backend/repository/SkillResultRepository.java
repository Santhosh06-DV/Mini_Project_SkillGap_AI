package com.skillgap.backend.repository;

import com.skillgap.backend.model.SkillResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SkillResultRepository extends JpaRepository<SkillResult, Long> {
    List<SkillResult> findByUserIdOrderBySavedAtDesc(Long userId);
}