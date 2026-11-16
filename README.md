# Starpath

Build an app that allows users to create a personal learning roadmap for learning coding languages, front-end development, back-end development, databases, and other areas relevant to the software development field.

The app should be available on web and mobile (responsive with mobile navigation).

Features:
- Curriculum catalog pulling in curriculums and courses from boot.dev, freeCodeCamp, Exercism, The Odin Project, CS50, and Roadmap.sh.
- Users can choose from pre-built career tracks (e.g. Frontend, Backend, Full Stack, Computer Science), or use an ad-hoc flexible playlist builder that allows users to choose individual courses and orders them in a logical progression based on prerequisites.
- Hybrid timeline and scheduling engine: users can set either target hours per week or a target completion date to calculate their pace and schedule.
- Daily goals checklist with external lesson links and estimated study times, plus a weekly calendar view that automatically rebalances if days are missed.
- Gamification: daily streaks, XP, level progression, and daily study check-ins.
- Completion and certificates: honor system to check off daily lessons, with the ability to add links to verified certificates/badges at the end of each course.
- Public learner profile displaying trophies, verified certificate links, streak stats, and current tracks.
- Social & Squads: users can have friends, form friend groups/study squads, set weekly group goals, and participate in friendly XP leaderboards and cheer nudges.
- Design: Bright, colorful, and fun aesthetic featuring hot pink, oranges, purples, and glowing yellow stars. Exciting, vibrant, and energizing.

This project was built with [Lovable](https://lovable.dev) as part of She Builds: Learning Edition 2026.

**Live app**: https://starpath.atlantadaniel.com

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
