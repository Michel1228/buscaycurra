# Audit Report: Guzzi AI Chat (BuscayCurra)
## Date: 17 June 2026
## Session: audit-17jun-001 | User: michelkm11batista@gmail.com

## Summary
23 queries executed across 8+ required categories. Guzzi handled 18/23 successfully (78%). 5 failed due to parsing/NLP issues. Job search with real offers is the strongest feature.

## Detailed Results

### 1. CHARLA CASUAL (Q1) - PASS
Hola, que tal -> Warm welcome, listed all capabilities. Excellent.

### 2. DERECHOS LABORALES - SMI 2026 (Q2) - PASS
SMI = 1231 eur/mes en 16 pagas. SEPE process detailed correctly. 70% first 6mo, 50% thereafter. Accurate.

### 3. EMIGRACION ALEMANIA (Q3->Q12) - INITIAL FAIL, RETRY PASS
Initial "quiero emigrar para trabajar en Alemania" parsed as job search.
Retry "que necesito para irme a trabajar a Alemania" -> Correct EU citizen info, no visa, Anmeldung, Steuer-ID, seguro medico.

### 4. PREPARACION ENTREVISTAS (Q4->Q14) - INITIAL FAIL, RETRY PASS
Initial mentioning specific role triggered "need_company_name".
Retry "preguntas trampa en entrevistas" -> Excellent STAR method advice.

### 5. CONSEJOS CV (Q5->Q20) - INITIAL FAIL, RETRY PASS
Initial "mejorar CV electricista" triggered "need_cv_data".
Retry "errores comunes en CVs" -> Excellent ATS, formatting, quantification advice.

### 6. BUSQUEDA OFERTAS VARIADAS - ALL PASS
- IT Backend Python Barcelona (Q6): 4 real offers, real URLs
- Enfermero Madrid (Q10): 5 offers, Sanitas/Adecco/MACROSAD, one at 36k/year
- Albanil Valencia (Q11): Multiple offers with salary ranges 1350-2200 eur
- Soldador Pamplona (Q21): 5 offers, Proman/Pacto/IMAN

### 7. CIUDADES PEQUENAS - MIXED
- Tudela camarero (Q7): No online offers but 4 local businesses with Google Maps data, phones, ratings. Excellent fallback.
- Fustinana (Q8,Q15,Q16): ALL 3 ATTEMPTS FAILED. Town not recognized at all.

### 8. SECTORES QUE MAS CONTRATAN (Q9->Q17) - INITIAL FAIL, RETRY PASS
Initial parsed as job search. Retry gave sector breakdown: IT, salud, logistica, hosteleria, construccion, admin. Salary ranges plausible but appear LLM-generated.

### BONUS
- Calculo paro 3 anos/1800eur (Q18,Q22): 12 months, 1260eur then 900eur. Empathetic + accurate.
- Emigracion Irlanda (Q19): IT/pharma/hospitality sectors, salary ranges, housing warning. Good.
- Au pair Europa (Q23): Age 18-30, country-specific pay (Germany 260eur/wk, France 80-100). Thorough.

## BUGS FOUND

### CRITICAL
1. Fustinana (~2500 inhabitants) not recognized as location in 3 attempts. Likely affects many small Spanish towns.

### MODERATE
2. Informational questions parsed as job searches (emigrar, sectores)
3. CV/interview advice triggers data-collection mode instead of giving general tips first

### MINOR
4. Some responses truncated mid-sentence
5. Sector salary data appears LLM-generated rather than from real-time analytics
6. Duplicate job listings from different scrapers (same RDT Ingenieros job 3x)

## FEATURE RATINGS
Job search (major cities): 5/5
Job search (small cities): 3/5
Local business contacts fallback: 5/5
Emigration info (EU): 3/5
Interview prep (general): 4/5
CV advice (general): 3/5
Labor rights/SMI/paro: 5/5
Sector analysis: 3/5
Casual conversation: 5/5
Au pair/niche topics: 4/5

## RECOMMENDATIONS
1. Add full INE municipios database for small town recognition
2. Add intent classification (informational vs job search)
3. Two-step responses: general advice first, then personalization offer
4. Cite sources for salary/statistical claims
5. Deduplicate job listings from multiple scrapers
6. Increase response size limit for longer answers
