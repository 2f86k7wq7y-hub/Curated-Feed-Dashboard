# Curated Feed — self-hosted, always-on content dashboard

Replaces compulsive X scanning with one clean dashboard. A GitHub Action runs in the
cloud on a schedule (independent of your computer), spins up RSSHub to pull your X Lists +
Substacks, accumulates everything into a deduped store, and publishes the dashboard to
GitHub Pages. Open the Pages URL on your phone and "Add to Home Screen" — it works like an app.

```
3 X Lists ─┐
Substacks ─┼─► GitHub Action (daily cron) ─► RSSHub + build.mjs ─► public/index.html ─► GitHub Pages ─► your phone
Blogs     ─┘                                  (dedupe + accumulate in data/feed.json)
```

Cost: $0. Dependencies: a free GitHub account.

---

## One-time setup (~20 min)

### 1. Make 3 public X Lists
On X (web), create three **public** Lists and add the accounts below to each. Open each
List, copy the number from its URL (`x.com/i/lists/THIS_NUMBER`), and paste those IDs into
`feeds.json` under `xLists[].listId`.

**Health (26)**
@afshineemrani @anabolicgut @BarbaraOneillAU @BasedBiohacker @BerbarianWizard @BioavailableNd @celestialbe1ng @coookwithchris @dr_ericberg @GubbaHomestead @GutOptimized @HansAmato @iamjustincscott @jjohnpotter @jonmunier @JPowFleshlight @limitlesstack @markkaplan20 @MattPiperJenks @maxmarchione @newstart_2024 @NoahRyanCo @nootropicguy @oxidativestate @theholisticnick @Zenfrog4

**Personal Development (81)**
@adele_bloch @AfsaRosette @aibytekat @AlpacaAurelius @anishmoonka @bluewmist @BottleBell @BowTiedPhys @BreatheLesss @CEOLandshark @chaseharris98 @colejaczko @conductr_ @cooltechtipz @Danieldalen @Dating_Dynamics @Daywrotethis @dickiebush @dismaien @dostoevesque @DrCarlHindy @DrDominicNg @DrJohnVervaeke @Dylanmadden @edgaralandough @ElishaDLong @esha_hq @fadule_ @FengShuiFlowZ @FU_joehudson @gaxrav @george__mack @Helios_Movement @hridoyreh @INFLUENCESUBCON @itswithinme_ @jackmoses777 @Jeanvaljean689 @justinskycak @KeruboSk @kramerposts @LeighStJohn33 @lichthauch @markowifk @maximumpain333 @megha_lilly @Men_Of_Purpose @MetaMorpehus @moonsrabbit7 @myfriendcallie @noampomsky @nopranablem @nosilverv @Octocuss1216 @onlysammms @pangmeli @ppppp1245688 @PromptLLM @psycheureka @Resorcinolworks @RudolfStein2026 @RyanHoliday @scottdomes @sunnkssdseraph @Tarmeim @TawohAwa @thecurioustales @thedankoe @thedulab @themaddierune @TheManMakerx @themgmtconsult @theo_jil @theralkia @turk1shprincess @TVachaW @VirtualElena @vividvoid @xansnds @YOHAMI @YourPrimePath

**Claude / AI (45)**
@0x_kaize @aiedge_ @AnatoliKopadze @ashwingop @Av1dlive @boxmining @coreyganim @cyrilXBT @DamiDefi @eng_khairallah1 @ericosiu @exploraX_ @hanakoxbt @Hawks0x @heynavtoor @heyrobinai @itsolelehmann @jasondoesstuff @JulianGoldieSEO @KanikaBK @leopardracer @levelsio @milesdeutscher @Mnilax @mstockton @neil_xbt @nicbstme @NickSpisak_ @noisyb0y1 @om_patel5 @PrajwalTomar_ @rohit4verse @RoundtableSpace @sairahul1 @sharbel @shawmakesmagic @simplifyinAI @Suryanshti777 @Tabbu_ai @the_smart_ape @trq212 @vibeeval @zeuuss_01 @zodchiii @zostaff

> Lists must be **public** for RSSHub to read them. Using Lists (not per-account routes)
> is what keeps this reliable — 3 requests instead of 150.

### 2. Get your X auth token (the one sensitive step)
RSSHub needs a logged-in session to read X. In a browser logged into X:
DevTools → Application → Cookies → `x.com` → copy the value of **`auth_token`**.
This is a credential — only store it as a GitHub **Secret**, never in the code.

### 3. Create the repo + push these files
Make a new **private** GitHub repo and push the contents of this folder
(`build.mjs`, `feeds.json`, `template.html`, `data/`, `.github/`).

### 4. Add the secret
Repo → Settings → Secrets and variables → Actions → **New repository secret**:
name `TWITTER_AUTH_TOKEN`, value = the auth_token from step 2.
(For redundancy you can paste 2–3 tokens comma-separated from alt accounts.)

### 5. Turn on Pages
Repo → Settings → Pages → **Source: GitHub Actions**.
Keep the repo private; you can keep the Pages site private too (Settings → Pages → Visibility)
or leave it public — it only shows headlines + links, no secrets.

### 6. First run
Repo → Actions → **Refresh Curated Feed** → **Run workflow**. When it finishes, the deploy
step prints your URL (`https://<you>.github.io/<repo>/`). Open it on your phone → Share →
**Add to Home Screen**.

---

## Daily life
- **Schedule:** edit the `cron` in `.github/workflows/refresh.yml`. Default `0 11 * * *`
  (~6am ET). Add more cron lines for more refreshes (RSSHub is free, no per-call cost).
- **Add a source:** put a new Substack/blog feed URL in `feeds.json`, or add an account to
  the relevant X List — no code change needed for List additions.
- **Reading state & the NEW badge** live in your browser, per device, and persist.
- The store (`data/feed.json`) accumulates over time and is capped at `maxStore` (600),
  so the dashboard keeps history even though each List route returns only recent posts.

## If X access breaks
RSSHub's X routes depend on the auth token staying valid. If the feed goes quiet, refresh
the `auth_token` cookie (re-do steps 2 & 4). This is the inherent tradeoff of the free,
self-hosted route vs. a paid API — expect occasional token refreshes.

## Files
- `build.mjs` — fetch, classify, dedupe, render (dependency-free Node).
- `feeds.json` — your List IDs, feed URLs, lane keywords, store cap.
- `template.html` — the dashboard UI (same one you approved).
- `data/feed.json` — the accumulated store (seeded with your existing vault clippings).
- `.github/workflows/refresh.yml` — the scheduled cloud job.
