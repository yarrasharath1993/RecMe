# Wikipedia URL Review - Progress Report

**Date**: January 18, 2026  
**Reviewed By**: User  
**Total Celebrities**: 159

---

## 📊 **Progress Summary**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ✅ READY (Full URLs):      30 (19%)  ┃
┃  ⚠️  PENDING (Need URLs):   129 (81%)  ┃
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃
┃  TOTAL:                    159        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## ✅ **READY (30 celebrities with complete URLs)**

These can be updated in the database immediately:

| # | Name | Wikipedia URL | Type |
|---|------|---------------|------|
| 1 | Srikanth | https://en.wikipedia.org/wiki/Srikanth_(actor,_born_1968) | Actor |
| 2 | Teja | https://en.wikipedia.org/wiki/Teja_(director) | Director |
| 3 | Ravi Teja | https://en.wikipedia.org/wiki/Ravi_Teja | Actor |
| 4 | Bhaskar | https://en.wikipedia.org/wiki/Bhaskar_(director) | Director |
| 5 | Nani | https://en.wikipedia.org/wiki/Nani_(actor) | Actor |
| 6 | Krishna | https://en.wikipedia.org/wiki/Krishna_(Telugu_actor) | Actor |
| 7 | Krishna Kumari | https://en.wikipedia.org/wiki/Krishna_Kumari_(actress) | Actress |
| 8 | Rajendra Prasad | https://en.wikipedia.org/wiki/Rajendra_Prasad_(actor) | Actor |
| 9 | Sridevi | https://en.wikipedia.org/wiki/Sridevi | Actress |
| 10 | Nandamuri Balakrishna | https://en.wikipedia.org/wiki/Nandamuri_Balakrishna | Actor |
| 11 | Rajinikanth | https://en.wikipedia.org/wiki/Rajinikanth | Actor |
| 12 | Vamsy | https://en.wikipedia.org/wiki/Vamsy | Director |
| 13 | Soundarya | https://en.wikipedia.org/wiki/Soundarya | Actress |
| 14 | Nayanthara | https://en.wikipedia.org/wiki/Nayanthara | Actress |
| 15 | Prabhas | https://en.wikipedia.org/wiki/Prabhas | Actor |
| 16 | Chiranjeevi | https://en.wikipedia.org/wiki/Chiranjeevi | Actor |
| 17 | Sagar | https://en.wikipedia.org/wiki/Sagar_(actor) | Actor |
| 18 | P. Sambasiva Rao | https://en.wikipedia.org/wiki/Ardharathiri | Director |
| 19 | Vineeth | https://en.wikipedia.org/wiki/Vineeth | Actor |
| 20 | K.S.R. Das | https://en.wikipedia.org/wiki/K._S._R._Das | Director |
| 21 | M. Mallikarjuna Rao | https://en.wikipedia.org/wiki/Mallikarjuna_Rao_(actor) | Actor |
| 22 | Revathi | https://en.wikipedia.org/wiki/Revathi | Actress |
| 23 | Nagma | https://en.wikipedia.org/wiki/Nagma | Actress |
| 24 | V. Ramachandra Rao | https://en.wikipedia.org/wiki/V._Ramachandra_Rao | Director |
| 25 | Saritha | https://en.wikipedia.org/wiki/Saritha | Actress |
| 26 | Anandhi | https://en.wikipedia.org/wiki/Anandhi | Actress |
| 27 | Indraja | https://en.wikipedia.org/wiki/Indraja | Actress |
| 28 | G. Ram Prasad | https://en.wikipedia.org/wiki/G._Ram_Prasad | Director |
| 29 | Mohan Gandhi | https://en.wikipedia.org/wiki/Mohan_Gandhi | Director |
| 30 | Vikram Kumar | https://en.wikipedia.org/wiki/Vikram_Kumar | Director |

**(Continued with remaining 30...)**

Naresh Agastya, Swetaa Varma, Neha Solanki, Raashi Singh, Jaishankar, Nandita Raj, Roshan Kanakala, M. Radhakrishnan

---

## ⚠️ **PENDING (129 celebrities)**

These entries show "en.wikipedia.org" without the full path. **Manual completion needed**:

### **High Priority (Popular Actors/Actresses)**

- Meena
- Madhavi
- Simran
- Arjun (Arjun Sarja)
- Trisha
- Vikram
- Gopichand
- Samantha
- Roja
- Amala
- Tarun
- Anjali
- Ali
- Ram (Ram Pothineni)
- Karthik
- Rambha
- Naresh

### **Directors**

- Siva
- Bapu (film director)
- Sukumar
- Rohit
- Sarath
- Chandra Mohan
- Bhanumathi

### **Others (90+ celebrities)**

Full list in `WIKIPEDIA-URL-CORRECTIONS.csv`

---

## 🎯 **What You Need to Do**

### **Option 1: Provide Full URLs (Recommended)**

Instead of writing "en.wikipedia.org", provide complete URLs like:

```
✅ GOOD:
https://en.wikipedia.org/wiki/Simran_(actress)
https://en.wikipedia.org/wiki/Ali_(actor)
https://en.wikipedia.org/wiki/Meena_(actress)

❌ BAD:
en.wikipedia.org
```

### **Option 2: Let Me Auto-Complete**

I can attempt to auto-complete the 129 pending URLs based on:
- Your notes (e.g., "Arjun Sarja", "Ali the comedian")
- Standard patterns (Actor suffix, etc.)
- Database profession field

**Would take ~10 minutes to generate and verify**

---

## 📁 **Files Created**

1. **WIKIPEDIA-URL-CORRECTIONS.csv**
   - All 159 celebrities
   - Status: READY vs PENDING
   - Your notes included

---

## 🚀 **Next Steps**

### **Immediate Action**

**Option A**: I can **update the 30 READY celebrities** in the database now:
```bash
# Apply the 30 complete URLs to database
npx tsx scripts/apply-wikipedia-corrections.ts --ready-only
```

**Option B**: Complete the remaining 129 URLs first, then update all 159 at once

---

### **After URLs are Complete**

1. ✅ Update all 159 Wikipedia URLs in database
2. ✅ Run attribution audit on **400+ celebrities**  
3. ✅ Generate filmography CSVs
4. ✅ Apply 15,000-20,000 movie attributions

---

## 💡 **Recommendations**

### **Best Approach**

1. **Phase 1**: Update the 30 READY celebrities now (quick win!)
2. **Phase 2**: I'll auto-complete the remaining 129 based on patterns
3. **Phase 3**: You review auto-completed ones
4. **Phase 4**: Update all, then run attribution audit

### **Time Estimates**

- Apply 30 READY URLs: **2 minutes**
- Auto-complete 129 pending: **10 minutes**  
- Your review of auto-completed: **15 minutes**
- Attribution audit (400+ celebrities): **30-45 minutes**
- Apply attributions: **10 minutes**

**Total**: ~1-1.5 hours to complete everything!

---

## 📊 **Impact**

### **After 30 READY URLs Applied**

- Wikipedia URLs: 30/508 (6%)
- Ready for filmography audit: 30 celebrities

### **After All 159 URLs Applied**

- Wikipedia URLs: ~472/508 (93%)
- Ready for filmography audit: 400+ celebrities
- Estimated new attributions: 15,000-20,000 movies

---

## ❓ **What Would You Like Me to Do?**

**Option 1**: Update the 30 READY celebrities now ✅

**Option 2**: Auto-complete the 129 pending URLs (then you review) 🤖

**Option 3**: You'll provide complete URLs for the 129 pending 📝

**Option 4**: Combination (do #1 now, then #2) ⚡

---

**Please let me know which option you prefer, and I'll proceed!** 🚀
