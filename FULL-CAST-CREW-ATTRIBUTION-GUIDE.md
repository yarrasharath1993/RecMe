# Full Cast & Crew Attribution System

## ✅ System Updated (Jan 18, 2026)

The attribution audit system now handles **ALL cast & crew roles** with proper categorization.

## 📋 Supported Roles

### Cast Roles (Actors)
| Role Type | Database Field | Description | Cast Type |
|-----------|---------------|-------------|-----------|
| Hero | `hero` | Main lead (male) | Lead |
| Heroine | `heroine` | Main lead (female) | Lead |
| Cast Members | `cast_members` | General cast | Supporting |
| Supporting Cast | `supporting_cast` (JSONB) | Supporting actors with roles | Supporting |
| Cameo | `supporting_cast` (JSONB) | Guest appearances | Cameo |

### Crew Roles (Technical)
| Role Type | Database Field | Location |
|-----------|---------------|----------|
| Director | `director` | Top-level |
| Producer | `producer` | Top-level |
| Music Director | `music_director` | Top-level |
| Cinematographer | `cinematographer` | Top-level or `crew.cinematographer` |
| Editor | `crew.editor` | JSONB crew object |
| Writer | `writer` or `crew.writer` | Top-level or JSONB |
| Lyricist | `crew.lyricist` | JSONB crew object |
| Choreographer | `crew.choreographer` | JSONB crew object |
| Art Director | `crew.art_director` | JSONB crew object |
| Costume Designer | `crew.costume_designer` | JSONB crew object |
| Production Designer | `crew.production_designer` | JSONB crew object |

## 📝 CSV Output Format

The audit now generates CSVs with these columns:

```
Status | Wikipedia Title | Year | Role | Cast Type | DB Movie ID | DB Title | DB Year | Current Attribution | Match % | Suggested Field | Action
```

**Example rows:**
```csv
"⚠️ EXISTS_NOT_ATTRIBUTED","Neerkumizhi","1965","Director","","30c58bda...","Movie Name","1965","Not attributed","92","director","Add K. Balachander as Director"
"⚠️ EXISTS_NOT_ATTRIBUTED","Arangetram","1973","Writer","","a2b4c1e2...","Movie Name","1973","Not attributed","88","writer","Add K. Balachander as Writer"
"⚠️ EXISTS_NOT_ATTRIBUTED","Major Chandrakanth","1966","Actor","Supporting","b3d5e6f7...","Movie Name","1966","Not attributed","95","cast_members","Add K. Balachander as Actor (Supporting)"
```

## 🔧 Role Detection Logic

The system automatically detects roles from Wikipedia filmography tables:

### Crew Roles Detected:
- **Director**: "Director", "Directed by"
- **Music**: "Music Director", "Composer", "BGM"
- **Cinematography**: "Cinematographer", "DOP", "Director of Photography"
- **Editing**: "Editor", "Editing"
- **Writing**: "Writer", "Screenplay", "Story", "Dialogue"
- **Lyrics**: "Lyricist", "Lyrics", "Songwriter"
- **Choreography**: "Choreographer", "Choreography", "Dance"
- **Art Direction**: "Art Director", "Production Designer"
- **Costumes**: "Costume Designer"
- **Production**: "Producer", "Produced by"

### Cast Categorization:
- **Lead**: "Lead role", "Hero", "Heroine", "Main role", "Protagonist", "Title role"
- **Supporting**: "Supporting role", "Supporting actor", "Secondary"
- **Cameo**: "Cameo", "Special appearance", "Guest appearance"
- **General**: "Actor", "Actress" (defaults to cast_members)

## 🎯 Attribution Examples

### Example 1: K. Balachander (Director/Writer)
```csv
Movie: Neerkumizhi (1965)
Role: Director
Suggested Field: director
Action: Add K. Balachander to director field

Movie: Arangetram (1973)
Role: Writer
Suggested Field: writer
Action: Add K. Balachander to crew.writer field
```

### Example 2: Chiranjeevi (Actor - Lead)
```csv
Movie: Indra (2002)
Role: Actor
Cast Type: Lead
Suggested Field: hero
Action: Add Chiranjeevi to hero field
```

### Example 3: Brahmanandam (Supporting Actor)
```csv
Movie: Ala Vaikunthapurramuloo (2020)
Role: Actor
Cast Type: Supporting
Suggested Field: supporting_cast
Action: Add {"name": "Brahmanandam", "role": "Comedy", "order": 1, "type": "supporting"}
```

## 🚀 How to Use

### 1. Run Full Audit (All 100 Actors)
```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/automated-attribution-audit.ts --top=100 2>&1 | tee full-attribution-audit.log
```

### 2. Check Progress
```bash
# Count completed audits
ls -1 attribution-audits/*.csv | wc -l

# View last 10 lines of log
tail -10 full-attribution-audit.log
```

### 3. Review Sample Outputs
```bash
# Check K. Balachander's audit (Director/Writer)
head -20 attribution-audits/k.-balachander-attribution.csv

# Check Chiranjeevi's audit (Actor)
head -20 attribution-audits/chiranjeevi-attribution.csv
```

### 4. Apply Fixes (Dry Run First)
```bash
# Test with one actor first
npx tsx scripts/apply-attribution-fixes.ts --actor="K. Balachander" --dry-run

# Apply for real
npx tsx scripts/apply-attribution-fixes.ts --actor="K. Balachander"

# Apply all fixes
npx tsx scripts/apply-attribution-fixes.ts --all
```

## 📊 Database Schema Reference

### Supporting Cast Structure (JSONB Array)
```typescript
supporting_cast: [
  {
    "name": "Brahmanandam",
    "role": "Comedy",
    "order": 1,
    "type": "supporting"
  },
  {
    "name": "Ali",
    "role": "Friend",
    "order": 2,
    "type": "cameo"
  }
]
```

### Crew Structure (JSONB Object)
```typescript
crew: {
  "cinematographer": "P.S. Vinod",
  "editor": "Marthand K. Venkatesh",
  "writer": "Trivikram Srinivas",
  "choreographer": "Prem Rakshith",
  "art_director": "A.S. Prakash",
  "lyricist": "Sirivennela Sitarama Sastry"
}
```

## ⚡ Key Features

✅ **Automatic Role Detection**: Detects director, actor, writer, music director, etc. from Wikipedia
✅ **Cast Categorization**: Identifies lead, supporting, and cameo roles
✅ **Smart Field Mapping**: Routes each person to the correct database field
✅ **JSONB Support**: Properly handles crew and supporting_cast JSON structures
✅ **Fuzzy Matching**: Finds movies even with slight title variations
✅ **Year Tolerance**: Matches movies within ±1 year of Wikipedia date
✅ **Attribution Check**: Verifies if person is already attributed before suggesting fixes

## 📈 Expected Results

For 100 actors auditing ~5,000 movies:
- **Directors**: Will be added to `director` field
- **Music Directors**: Added to `music_director` field
- **Editors/Lyricists/Choreographers**: Added to `crew` JSONB
- **Lead Actors**: Added to `hero`/`heroine` fields
- **Supporting Actors**: Added to `supporting_cast` JSONB array
- **General Cast**: Added to `cast_members` comma-separated string

## 🔄 Next Steps

1. ✅ **Audit complete** → Wait for all 100 CSVs to generate
2. **Review samples** → Check 3-5 CSV files for accuracy
3. **Test one actor** → Run apply script with `--dry-run`
4. **Apply fixes** → Execute for all actors
5. **Verify** → Spot-check database updates
6. **Celebrate** 🎉 → Complete cast & crew attribution!

## 📞 Troubleshooting

### Issue: "Role not detected correctly"
**Fix**: The Wikipedia table structure may vary. Check the HTML source and adjust role detection patterns if needed.

### Issue: "Movie shows as MISSING but exists"
**Fix**: Title mismatch. Check if:
- Movie has different English vs Telugu title
- Year is off by more than 1 year
- Title has special characters or transliteration issues

### Issue: "Actor attributed to wrong field"
**Fix**: Role detection may need refinement. Check CSV "Role" column and adjust `determineRoleType()` function.

---

**Status**: ✅ System operational with full cast & crew support
**Last Updated**: Jan 18, 2026
**Files Modified**:
- `scripts/automated-attribution-audit.ts`
- `scripts/apply-attribution-fixes.ts`
