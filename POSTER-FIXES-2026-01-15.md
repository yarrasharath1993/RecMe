# 🎬 Poster & Duplicate Fixes - January 15, 2026

**Status**: ✅ Partially Complete (1/3 fixed)

---

## 📊 **Issues Summary**

| Issue | Status | Action |
|-------|--------|--------|
| 1. Kirayi Dada Duplicate | ✅ **FIXED** | Deleted duplicate entry |
| 2. Auto Driver (1998) Wrong Poster | ⏳ **PENDING** | Manual poster update needed |
| 3. Shanti Kranti (1991) Tamil Poster | ⏳ **PENDING** | Need Telugu poster with Nagarjuna |

---

## ✅ **1. Kirayi Dada Duplicate - FIXED**

### **Problem**:
Two entries for the same movie:
```
❌ "Kirai Dada" (1987) - Hero: Nagarjuna
❌ "Kirayi Dada" (1987) - Hero: Akkineni Nagarjuna
```

### **Solution**:
```
✅ KEPT: "Kirayi Dada" (1987) - Hero: Akkineni Nagarjuna
❌ DELETED: "Kirai Dada" (1987) - Hero: Nagarjuna
```

### **Result**:
- Duplicate deleted from database ✅
- Career milestones cleaned up ✅
- Only one entry remains ✅

**Action**: Hard refresh browser to see changes

---

## ⏳ **2. Auto Driver (1998) - Wrong Poster**

### **Current Status**:
```
Movie: Auto Driver (1998)
Hero: Akkineni Nagarjuna
Director: Suresh Krishna (originally listed as Longjam Meena Devi - incorrect!)
Language: Telugu
TMDB ID: 1458574

Current Poster:
https://image.tmdb.org/t/p/w500/4CXg65TANFOsrO4o22YTKd2iW0E.jpg
```

### **Issue**:
User reports the current poster is wrong for the Telugu version

### **Suggested Fix**:
Use Wikipedia theatrical poster:
```
https://upload.wikimedia.org/wikipedia/en/9/91/Auto_Driver_%281998_film%29.jpg
```

### **SQL Command**:
```sql
-- Update Auto Driver poster
UPDATE movies 
SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/9/91/Auto_Driver_%281998_film%29.jpg',
    director = 'Suresh Krishna'
WHERE id = 'd75c4f63-8542-4216-8028-b19a8fd48b48';
```

### **Verification Needed**:
- [ ] Verify the Wikipedia poster is correct for Telugu version
- [ ] Verify director is "Suresh Krishna" not "Longjam Meena Devi"
- [ ] Update database
- [ ] Test image loads correctly

---

## ⏳ **3. Shanti Kranti (1991) - Tamil Poster Used**

### **Current Status**:
```
Movie: Shanti Kranti (1991)
Hero: Akkineni Nagarjuna
Director: V. Ravichandran
Language: Telugu
TMDB ID: 66253

Current Poster (WRONG - Tamil version):
https://image.tmdb.org/t/p/w500/6ULQIW1Mb833f4xau1PWGaadmJY.jpg
```

### **Issue**:
- User confirmed current poster is from Tamil version
- This is a multilingual film (Kannada, Telugu, Tamil, Hindi)
- Need Telugu poster with Nagarjuna

### **Context**:
- Released September 19, 1991 (Telugu)
- Nagarjuna starred in the Telugu version
- Wikipedia shows Kannada VCD cover, not Telugu theatrical poster

### **Suggested Alternatives**:

**Option 1**: Kannada version poster (from Wikipedia):
```
https://upload.wikimedia.org/wikipedia/en/thumb/4/45/Shanti_Kranti_film_poster.jpg/220px-Shanti_Kranti_film_poster.jpg
```
(Better quality version):
```
https://upload.wikimedia.org/wikipedia/en/4/45/Shanti_Kranti_film_poster.jpg
```

**Option 2**: Search for Telugu-specific poster
- Check Filmibeat Telugu fan photos
- Check regional cinema archives
- Check collector forums

### **SQL Command** (when Telugu poster found):
```sql
-- Update Shanti Kranti poster
UPDATE movies 
SET poster_url = '<TELUGU_POSTER_URL_HERE>'
WHERE id = '7e8181bf-a26d-4433-8772-70c76078cf38';
```

### **Temporary Fix** (if no Telugu poster found):
```sql
-- Use Kannada poster as temporary fix
UPDATE movies 
SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/4/45/Shanti_Kranti_film_poster.jpg'
WHERE id = '7e8181bf-a26d-4433-8772-70c76078cf38';
```

---

## 🔍 **Additional Findings**

### **Other "Kirayi" Movies in Database**:
```
1. Kirayi Rowdylu (1981) - Chiranjeevi ✅
2. Kirayi Dada (1987) - Nagarjuna ✅ (duplicate removed)
3. Kirayi Gunda (1993) - Krishna ✅
4. Kirayi Bommalu (1983) - Suman ✅
5. Kirayi Kotigadu (1983) - Krishna ✅
6. Kirayi Rangadu (1983) - Chiranjeevi ✅
7. Kirai Alludu (1984) - Krishna ✅
```

All other "Kirayi" movies are unique - no duplicates found ✅

---

## 📝 **Action Items**

### **Immediate Actions**:
- [x] Delete Kirayi Dada duplicate
- [ ] Verify Auto Driver poster URL
- [ ] Find Telugu Shanti Kranti poster with Nagarjuna

### **User Actions**:
- [ ] Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Verify Kirayi Dada shows only once
- [ ] Confirm Auto Driver poster after update
- [ ] Confirm Shanti Kranti poster after update

### **Future Improvements**:
- [ ] Add poster language metadata to database
- [ ] Implement poster verification workflow
- [ ] Add multilingual movie version tracking
- [ ] Create manual poster curation queue

---

## 🎯 **Quick Fix Commands**

Run these SQL commands in Supabase SQL Editor after verifying URLs:

```sql
-- 1. Kirayi Dada duplicate: ✅ ALREADY FIXED via script

-- 2. Auto Driver poster fix (verify URL first!)
UPDATE movies 
SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/9/91/Auto_Driver_%281998_film%29.jpg',
    director = 'Suresh Krishna'
WHERE id = 'd75c4f63-8542-4216-8028-b19a8fd48b48';

-- 3. Shanti Kranti poster fix (temporary - use Kannada poster until Telugu found)
UPDATE movies 
SET poster_url = 'https://upload.wikimedia.org/wikipedia/en/4/45/Shanti_Kranti_film_poster.jpg'
WHERE id = '7e8181bf-a26d-4433-8772-70c76078cf38';
```

---

## 📚 **References**

- **Kirayi Dada**: https://en.wikipedia.org/wiki/Kirayi_Dada
- **Auto Driver**: https://en.wikipedia.org/wiki/Auto_Driver
- **Shanti Kranti**: https://en.wikipedia.org/wiki/Shanti_Kranti
- **Filmibeat Photos**: https://www.filmibeat.com/telugu/movies/shanti-kranthi/fan-photos.html

---

**Last Updated**: January 15, 2026  
**Script**: `scripts/fix-kirayi-duplicate-final.ts`  
**Status**: 1/3 complete, 2 pending manual poster verification
