# EARTH JUKEBOX — GLOBAL RAIN & THE SOUND OF CHANGE
## Complete Development Instructions for Antigravity

You are the lead full-stack developer, UI/UX designer, and technical architect for our NASA Space Apps Challenge 2026 project: **Earth Jukebox**.

Your task is to inspect our existing project, understand its current architecture, and develop it into a polished, interactive, scientifically responsible experience.

**IMPORTANT: Do not build an unrelated new website. Work on top of our existing project. Preserve all working features and improve them.**

We are a team of three students participating in NASA Space Apps Challenge 2026.

---

# 1. PROJECT VISION

Earth Jukebox explores how our planet sounds.

Our project has two connected experiences:

1. **Global Rain:** Explore worldwide precipitation data and listen to its musical representation.
2. **The Sound of Change:** Explore urban noise pollution and discover how different environmental and urban-planning interventions can transform a noisy city into a quieter, healthier environment.

The central concept is:

"Earth is constantly making music. We want people to explore it, hear it, and understand how human decisions change its sound."

The website should feel like an interactive scientific experience, not a generic dashboard.

---

# 2. EXISTING PROJECT — PRESERVE AND IMPROVE

First, inspect the entire existing codebase.

Our existing website already includes:

- An interactive global map.
- NASA precipitation data.
- Rainfall information for different geographical locations.
- The ability to select locations and hear rainfall represented through sound.
- Approximately 50 cities with noise pollution scores.
- City-specific noise descriptions and corresponding sound representations.

Preserve these features.

Do not remove existing functionality, data, components, or working interactions unless absolutely necessary.

Before making changes:
- Identify the frontend framework and project structure.
- Identify existing APIs and data sources.
- Identify the existing audio implementation.
- Understand how the map and city data work.
- Reuse existing components and styles where possible.

Do not replace working functionality with static mockups.

---

# 3. NEW EXPERIENCE: THE SOUND OF CHANGE

Create a new, visually impressive experience that allows users to explore how urban policies and environmental interventions affect city noise.

The experience should begin with a deliberately noisy city.

Preferred initial location: New York City, Manhattan.

I will provide video assets generated using Google Flow. Integrate these assets into the website.

The opening experience should contain:

- A cinematic urban video background.
- City name and location.
- A prominent simulated noise index (0–100).
- A short explanation of the city's current noise situation.
- A clear button to start exploring interventions.
- A visible sound control.

The first impression should be immersive and engaging.

Use the provided Google Flow video as the background. Do not generate a replacement video if a suitable supplied asset exists.

If the video files are not yet available, create the video integration system with clearly documented asset paths and graceful fallbacks.

---

# 4. THE FOUR INTERVENTION CATEGORIES

Create four interactive categories, preferably using tabs or a similarly intuitive interface.

Every intervention must have an independent ON/OFF toggle.

The toggles must affect the simulated noise index, relevant sound channels, and visual presentation.

## CATEGORY 1 — TRANSPORTATION & TRAFFIC

Interventions:

- Strengthen public transportation.
- Introduce traffic and speed management.
- Implement low-noise asphalt.
- Improve vehicle management.
- Introduce electric public transportation.
- Reduce unnecessary vehicle horn usage.

Expected effects:

- Reduce relevant traffic noise.
- Reduce engine noise where electric vehicles replace conventional vehicles.
- Reduce road and tire noise where appropriate.
- Improve the perceived urban soundscape.

## CATEGORY 2 — ARCHITECTURE & SOUND INSULATION

Interventions:

- Mandatory building sound insulation.
- Acoustic architecture and building design.
- Installation of suitable noise barriers.
- Green building standards.

Expected effects:

- Improve indoor acoustic comfort.
- Reduce exposure for people protected by suitable barriers.
- Improve the acoustic quality of buildings.

IMPORTANT:

Building insulation primarily reduces indoor exposure. Do not incorrectly represent it as reducing all outdoor street noise.

Where possible, introduce an Indoor / Outdoor listening perspective.

## CATEGORY 3 — URBAN PLANNING & SOURCE CONTROL

Interventions:

- Relocate heavy industry outside residential areas.
- Introduce green belts and vegetation buffers.
- Strengthen entertainment venue inspections.
- Strengthen workplace noise inspections.
- Introduce construction-hour restrictions.
- Create quiet delivery zones.

Expected effects:

- Reduce industrial noise exposure.
- Reduce noise around residential areas.
- Reduce nighttime disturbances.
- Improve the distribution of noisy activities across the city.

## CATEGORY 4 — PUBLIC AWARENESS

Interventions:

- Public noise-awareness campaigns.
- Responsible headphone and listening habits.
- Anti-honking campaigns.
- Community quiet hours.

IMPORTANT:

Headphone awareness is related to hearing health, not a direct reduction in ambient urban noise. Do not artificially reduce the city's noise index when this intervention is activated.

Anti-honking campaigns and community quiet hours may affect the relevant environmental sound channels.

---

# 5. INTERACTIVE NOISE SIMULATION

This is one of the most important parts of the project.

The website must respond immediately when a user activates or deactivates an intervention.

For example:

When the user enables electric public transportation:
- The corresponding toggle changes state.
- The simulated noise index updates.
- Relevant engine-noise audio becomes quieter.
- The city visualization reflects the intervention.

When the user enables industry relocation:
- Industrial noise decreases.
- Relevant visual indicators update.
- The simulated index changes according to the model.

When several interventions are activated, their effects should combine.

Requirements:

- Every intervention must work independently.
- Multiple interventions must work simultaneously.
- Add a Reset button.
- Add an Apply All button.
- Add a Before / After comparison.
- Show which interventions are currently active.
- Add smooth transitions.
- Make changes immediate and visually understandable.

Use a centralized simulation state so the noise index, audio, and visuals always remain synchronized.

Do not implement fake toggles that only change their appearance.

---

# 6. AUDIO SYSTEM — EXTREMELY IMPORTANT

The audio experience should be one of the most impressive features of Earth Jukebox.

Do not use one single audio file for the entire city.

Build a layered audio system using separate sound channels.

Required channels:

1. Traffic
   - Cars
   - Buses
   - Engines
   - Horns
   - Road noise

2. Construction
   - Construction machinery
   - Drilling
   - Urban construction ambience

3. Industry
   - Factory ambience
   - Industrial machinery
   - Low-frequency industrial hum

4. Crowd and Entertainment
   - Pedestrians
   - Conversations
   - Urban entertainment ambience

5. Nature
   - Birds
   - Wind
   - Trees and leaves
   - Natural ambience

Use separate audio files for these channels.

Possible sound asset sources:

- Freesound
- Pixabay Sound Effects
- Mixkit

Check licensing and attribution requirements before using any downloaded audio.

## Technical implementation

Use the Web Audio API with AudioContext and GainNodes.

Each audio channel should have its own volume control.

The intervention toggles should control the relevant GainNodes.

For example:

- Electric public transportation affects engine noise.
- Low-noise asphalt affects road/tire noise.
- Anti-honking campaigns affect horn noise.
- Construction restrictions affect construction audio.
- Industry relocation affects industrial audio.
- Green belts may reduce the perceived impact of certain nearby noise sources.

The audio system must:

- Start only after a user interaction, respecting browser autoplay restrictions.
- Support mute and master volume.
- Support smooth volume transitions.
- Avoid sudden audio cuts.
- Prevent duplicate audio playback.
- Clean up audio resources correctly.
- Work with multiple simultaneously enabled interventions.

When the user enables several interventions, the soundscape should gradually become quieter and more natural.

Nature sounds should become more noticeable in the quieter scenario, but do not pretend that nature sounds themselves eliminate pollution.

If audio assets are unavailable, build the complete audio architecture and clearly document where the files should be placed. Do not silently substitute unrelated sounds.

---

# 7. NOISE INDEX AND SCIENTIFIC RESPONSIBILITY

Create a simulated Noise Index ranging from 0 to 100.

IMPORTANT:

This is a simulation, not a real decibel measurement.

Clearly label it:

"Simulated Noise Index"

Do not display the simulated index as dB.

The initial city should have a high noise score.

Every intervention should have a defined effect based on its relevant noise sources.

Avoid simply subtracting an arbitrary fixed number for every toggle.

Use a source-based model that considers:

- Traffic
- Construction
- Industry
- Crowd and entertainment
- Other relevant sources

Keep the model centralized and configurable.

Avoid double-counting overlapping interventions.

If real decibel calculations are implemented, remember that decibels are logarithmic:

L_total = 10 × log10(sum(10^(Li/10)))

Do not add decibel values linearly.

Clearly distinguish between:

- Real-world measurements.
- User-reported complaints.
- Estimated or simulated values.

The project should be scientifically responsible and transparent about assumptions.

---

# 8. VISUAL EXPERIENCE

The design should feel modern, immersive, cinematic, and professional.

Design direction:

- Dark, atmospheric urban environment.
- High-quality typography.
- Clear visual hierarchy.
- Smooth transitions.
- Minimal but informative interface.
- Subtle animations.
- Responsive design.
- Professional scientific storytelling.

Avoid:
- Generic admin-dashboard design.
- Excessive cards.
- Unnecessary gradients.
- Overcrowded controls.
- Excessive text.
- Distracting animations.

The city video should remain the main visual element.

The interface should be layered over the video without hiding the city.

When interventions are activated, the visual experience should communicate improvement.

Possible visual changes:

- Traffic becomes visually calmer.
- Green elements become more prominent.
- Noise barriers or vegetation overlays appear where appropriate.
- Construction activity is reduced.
- The overall environment feels less chaotic.

Do not regenerate the entire video for every toggle. Use overlays, CSS animations, visual effects, and existing assets to represent individual interventions.

---

# 9. GOOGLE FLOW VIDEO INTEGRATION

I am generating the urban footage using Google Flow.

Integrate the resulting video files into the project.

Requirements:

- Support local video assets.
- Use optimized video playback.
- Use appropriate object-fit and responsive sizing.
- Add a fallback image.
- Avoid unnecessary loading delays.
- Use smooth transitions between different visual states.
- Keep the video muted because audio is managed separately through the audio engine.

If I provide both noisy and quiet versions of the same city scene, use them for a smooth before/after transition.

Keep the same city, camera perspective, and visual composition wherever possible.

Suggested asset structure:

public/
  assets/
    videos/
      noisy-city.mp4
      quiet-city.mp4
    audio/
      traffic.mp3
      horns.mp3
      construction.mp3
      industry.mp3
      crowd.mp3
      nature.mp3

Adapt these paths if the existing project uses a different asset structure.

---

# 10. GLOBAL RAIN EXPERIENCE

The original Global Rain experience must remain available.

The website should connect the two experiences naturally.

Suggested navigation:

- Home
- Global Rain
- Sound of Change
- About

Global Rain should continue to provide:

- Interactive global map.
- Location selection.
- Rainfall information.
- Rainfall sonification.
- Historical/current precipitation data where available.

Preserve the existing NASA GPM IMERG integration.

Where data is displayed, provide clear attribution to NASA.

Do not fabricate NASA measurements.

If data is unavailable, show a clear loading, unavailable, or fallback state.

---

# 11. USER EXPERIENCE AND NAVIGATION

The experience should follow a clear journey:

1. User enters Earth Jukebox.
2. User discovers the Global Rain and Sound of Change experiences.
3. User opens Sound of Change.
4. A noisy city appears.
5. User explores four intervention categories.
6. User activates different policies.
7. Noise Index, audio, and visuals update.
8. User compares the original and improved scenarios.
9. User can return to Global Rain.

Add a short explanation of why urban noise pollution matters.

Make the project understandable even to someone who has never heard of NASA GPM IMERG or environmental noise modeling.

---

# 12. TECHNICAL QUALITY

Requirements:

- Maintainable component architecture.
- Reusable components.
- Centralized application state.
- Clean code.
- Responsive layout.
- Good performance.
- No unnecessary dependencies.
- No broken navigation.
- No console errors.
- No placeholder interactions presented as finished features.
- Graceful handling of missing assets.
- Proper accessibility labels for controls.
- Keyboard-accessible toggles.
- Clear loading states.

Do not break existing routes or APIs.

Do not delete existing data.

Do not hardcode fake scientific measurements.

If you need to make assumptions, document them.

---

# 13. DEVELOPMENT WORKFLOW

Work in this order:

PHASE 1 — INSPECTION
- Inspect the existing codebase.
- Understand the architecture.
- Identify current functionality.
- Identify reusable components.
- Report any important technical limitations.

PHASE 2 — ARCHITECTURE
- Plan the new experience.
- Define components and state.
- Define the audio architecture.
- Define the simulation model.
- Preserve the existing project.

PHASE 3 — IMPLEMENTATION
- Build the Sound of Change experience.
- Integrate the Google Flow video assets.
- Implement the four intervention categories.
- Implement functional toggles.
- Implement the Noise Index.
- Implement the layered audio system.
- Implement before/after comparison.
- Connect the experience to Global Rain.

PHASE 4 — TESTING
Test all intervention combinations.

Verify:
- Toggles actually work.
- Audio channels respond correctly.
- Noise Index updates correctly.
- Reset works.
- Apply All works.
- Video loads correctly.
- Audio starts after user interaction.
- Existing Global Rain features still work.
- Mobile and desktop layouts work.

PHASE 5 — FINAL POLISH
- Improve transitions.
- Improve typography.
- Fix layout issues.
- Optimize assets.
- Remove unnecessary elements.
- Make the project presentation-ready.

---

# 14. PRIORITIES

If time is limited, prioritize:

1. Preserve the existing Global Rain experience.
2. Build a complete Sound of Change landing experience.
3. Integrate the Google Flow video.
4. Implement all four intervention categories.
5. Make every toggle functional.
6. Build the Noise Index simulation.
7. Implement the layered audio system.
8. Add before/after comparison.
9. Polish the visuals.

A smaller number of fully functional features is better than many incomplete features.

---

# 15. FINAL EXPECTATION

The result should be a cohesive, working NASA Space Apps Challenge project.

It should not look like a collection of unrelated pages.

It should tell one story:

**We can listen to our planet, understand its environmental patterns, and explore how human decisions can change the way our world sounds.**

Build the actual working implementation, not just a design proposal.

Start by inspecting the existing repository. Then implement the project systematically, preserving all working functionality.

At the end, provide a concise report explaining:
- What you changed.
- What existing features you preserved.
- What new features work.
- Which assets are still missing.
- How to run the project.
- Any remaining limitations.

Do not stop after planning. Implement the features.