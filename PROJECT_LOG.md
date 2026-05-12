# 🚀 Misroute Defaulter Portal

## 🧭 Current Status
- Upload → Working
- Bucket Engine → Working
- Aggregation → Working
- Decision Engine → Working
- Workflow → Working
- DB → Connected (in progress)

---

## 🎯 Current Focus
- Database persistence
- UID conflict handling

---

## 🧨 Current Problem
- Need to prevent duplicate AWB + Action_User
- Need audit log for changes

---

## ✅ Last Completed
- Git setup
- GitHub push
- Workflow UI working

---

## 🔜 Next Step
- Store processed data in DB (correct layer)
- Add UNIQUE constraint logic
- Add audit log system

---

## 🐞 Known Issues
- (write errors here)
- (example: aggregation mismatch)

---

## 💡 Learnings
- Frequency = unique days
- Normalize data before logic

---

## 🧪 Test Cases
- Upload duplicate file → should not duplicate
- Same AWB + GC different data → warning

---

## 📌 Notes
- This system = decision engine, not just dashboard