# Security Specification: Razmik y Gayane — ¡Habla y Gana!

## 1. Data Invariants
1. **Strict Profile Isolation (Razmik vs Gayane vs Profesor)**:
   - A user cannot claim `profesor` role unless their Google account email is verified (`email_verified == true`) and matches the bootstrapped teacher email or an existing `/admins/{uid}` document.
   - A user cannot claim `razmik` or `gayane` role unless they provide the valid teacher-issued access code whose SHA-256 hash exists in `/access_codes/{codeHash}` with matching `role`.
   - Students can NEVER read `/teacher_settings` or `/access_codes`.
2. **Private Student Results & Voice Recordings**:
   - Razmik can ONLY read/create/delete his own `game_sessions`, `voice_recordings`, `recordings_audio`, and `student_progress/razmik`. He CANNOT read Gayane's private records or recordings.
   - Gayane has symmetric strict isolation.
   - Teacher (`isAdmin()`) can read and review both students' records and recordings.
3. **Immutable Teacher Grades & Terminal Review Locking**:
   - Students must create `voice_recordings` with `status == 'pending'`, `verdict == 'none'`, `teacherPoints == 0`, `teacherComment == ''`.
   - Students can NEVER modify `status`, `verdict`, `teacherPoints`, `teacherComment`, or `reviewedAt`.
   - Once a recording is `reviewed`, students cannot alter it.
4. **Aggregated Competition Leaderboard (`RAZMIK VS GAYANE`)**:
   - Stored separately in `/leaderboard/{studentId}` (`razmik` and `gayane`) with ONLY numeric summary stats; both authenticated students can read both summary docs without exposing any private answers or voice recordings.
5. **Server Timestamps & Strict Keys**:
   - All `createdAt` and `updatedAt` timestamps must match `request.time`.
   - All creates enforce `hasAll` + `hasOnly`; all updates enforce `affectedKeys().hasOnly(...)` + full schema validation.

## 2. The "Dirty Dozen" Attack Payloads
1. Student self-assigns `role: 'profesor'` in `/users/{uid}`. -> `PERMISSION_DENIED`
2. Student attempts to read `/teacher_settings/codes` or list `/access_codes`. -> `PERMISSION_DENIED`
3. Unverified email spoof (`email == teacher`, `email_verified == false`) attempting admin read/write. -> `PERMISSION_DENIED`
4. Razmik tries to read or list Gayane's `game_sessions` or `voice_recordings`. -> `PERMISSION_DENIED`
5. Razmik tries to forge a `game_session` with `studentId: 'gayane'` or someone else's `ownerUid`. -> `PERMISSION_DENIED`
6. Student creates a `voice_recording` pre-marked as `status: 'reviewed'`, `verdict: 'correcto'`, `teacherPoints: 20`. -> `PERMISSION_DENIED`
7. Student tries to update `teacherPoints` or `teacherComment` on an existing `voice_recording`. -> `PERMISSION_DENIED`
8. Student submits a "Shadow Update" adding ghost field `isAdmin: true` to `/users/{uid}` or `/game_sessions/{id}`. -> `PERMISSION_DENIED`
9. Student sends a fake client-side timestamp (`createdAt != request.time`). -> `PERMISSION_DENIED`
10. Attacker injects an oversized 1.5KB document ID (`isValidId` check fails). -> `PERMISSION_DENIED`
11. Student tries to update `score` or `correctCount` on a `game_session` while marking `submittedToTeacher: true`. -> `PERMISSION_DENIED`
12. Student tries to read `recordings_audio/{recordingId}` belonging to the other student. -> `PERMISSION_DENIED`
