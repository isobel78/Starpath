export const KNOWN_PROVIDERS = ["boot.dev", "freeCodeCamp", "Exercism", "The Odin Project", "CS50", "Roadmap.sh"];
export const KNOWN_AREAS = ["Languages", "Frontend", "Backend", "Databases", "CS Fundamentals", "DevOps", "Game Development", "UI/UX & Product Design"];
export type Provider = string;
export type Area = string;

export interface Course {
  id: string;
  title: string;
  provider: Provider;
  area: Area;
  hours: number;
  url: string;
  prereqs: string[];
  units: string[];
  blurb: string;
  tags?: string[];
  /** Added by the signed-in learner (only they can see it). */
  userAdded?: boolean;
}

export const PROVIDER_COLORS: Record<string, string> = {
  "boot.dev": "bg-chart-1",
  freeCodeCamp: "bg-chart-2",
  Exercism: "bg-chart-3",
  "The Odin Project": "bg-chart-4",
  CS50: "bg-chart-5",
  "Roadmap.sh": "bg-primary",
};

const c = (x: Course) => x;

export const COURSES: Course[] = [
  c({ id: "rm-ux-design", title: "UX Design Roadmap", provider: "Roadmap.sh", area: "UI/UX & Product Design", hours: 40, url: "https://roadmap.sh/ux-design", prereqs: [], blurb: "Explore product goals, user personas, behavior design, wireframing, prototyping and measuring impact. A community guide with an estimated 40-hour study plan.", units: ["Understanding the Product", "Target Users and User Personas", "Business Models and Competitor Analysis", "Human Decision Making", "Behavior Design Frameworks", "Conceptual Design and User Stories", "Wireframing and Prototyping", "UX Patterns and Best Practices", "Testing and Measuring Impact", "Gathering Lessons and Iterating"] }),
  c({ id: "fcc-figma-ux", title: "Learn Figma for UI/UX Design", provider: "freeCodeCamp", area: "UI/UX & Product Design", hours: 6, url: "https://www.freecodecamp.org/news/learn-figma-for-ui-ux-design/", prereqs: ["rm-ux-design"], blurb: "A six-hour video course by Wish Naik: build style guides, wireframes and high-fidelity prototypes through travel, car dealership and food delivery projects.", units: ["Figma Interface and Tools", "Style Guides and Color Systems", "Wireframes and High-Fidelity Prototypes", "Components, Auto Layout and Constraints", "Travel Website Project", "Car Dealership Website Project", "Food Delivery App Project", "Advanced Components and 3D Web Elements"] }),
  c({ id: "fcc-figma-ui", title: "UI Design with Figma", provider: "freeCodeCamp", area: "UI/UX & Product Design", hours: 10, url: "https://www.freecodecamp.org/news/ui-design-with-figma-tutorial/", prereqs: ["fcc-figma-ux"], blurb: "A ten-hour video course by Joseph Brendan covering typography, layout, components, responsive websites and mobile app design. Includes hands-on UI projects.", units: ["Figma Setup, Shapes and Selection", "Typography, Colors and Drawing Tools", "Spacing and Formatting Principles", "Auto Layout, Constraints and Resizing", "Website Design and Design Principles", "Styles, Components and Variants", "Layout Grids and Responsive Design", "Material Design and Tailwind UI", "Responsive Landing Page Project", "Mobile Apps and Iconography", "Figma Tokens and Animation", "Mobile Design Project"] }),
  c({ id: "cs50-games", title: "CS50's Introduction to 2D Game Development", provider: "CS50", area: "Game Development", hours: 80, url: "https://cs50.harvard.edu/games/", prereqs: ["cs50x"], blurb: "Build 2D games with Lua and LÖVE: graphics, animation, sound and collision detection. Free OpenCourseWare with eight game projects and a final project.", units: ["Pong", "Flappy Bird", "Breakout", "Match 3", "Super Mario Bros.", "Legend of Zelda", "Angry Birds", "Pokémon", "Final Project"] }),
  c({ id: "rm-game-dev", title: "Game Developer Roadmap", provider: "Roadmap.sh", area: "Game Development", hours: 40, url: "https://roadmap.sh/game-developer", prereqs: ["cs50-games"], blurb: "Explore a community guide to game engines, game math, graphics, physics and the skills for a game-development career.", units: ["Game Development Foundations", "Game Math", "Game Engines", "Game Physics", "Graphics and Rendering", "Game AI", "Audio", "Networking", "Optimization", "Publishing Your Game"] }),
  c({ id: "cs50x", title: "CS50x: Introduction to Computer Science", provider: "CS50", area: "CS Fundamentals", hours: 100, url: "https://cs50.harvard.edu/x/", prereqs: [], blurb: "Harvard's legendary intro: C, algorithms, memory, Python, SQL and the web.", units: ["Week 0: Scratch", "Week 1: C", "Week 2: Arrays", "Week 3: Algorithms", "Week 4: Memory", "Week 5: Data Structures", "Week 6: Python", "Week 7: SQL", "Week 8: HTML, CSS, JavaScript", "Week 9: Flask", "Final Project"] }),
  c({ id: "cs50p", title: "CS50P: Programming with Python", provider: "CS50", area: "Languages", hours: 60, url: "https://cs50.harvard.edu/python/", prereqs: [], blurb: "Learn Python from functions to OOP with problem sets.", units: ["Functions & Variables", "Conditionals", "Loops", "Exceptions", "Libraries", "Unit Tests", "File I/O", "Regular Expressions", "Object-Oriented Programming", "Final Project"] }),
  c({ id: "cs50w", title: "CS50W: Web Programming with Python & JS", provider: "CS50", area: "Backend", hours: 80, url: "https://cs50.harvard.edu/web/", prereqs: ["cs50x"], blurb: "Django, JavaScript, SQL, testing and scalability.", units: ["HTML & CSS", "Git", "Python", "Django", "SQL, Models & Migrations", "JavaScript", "User Interfaces", "Testing & CI/CD", "Scalability & Security", "Capstone"] }),
  c({ id: "cs50sql", title: "CS50 SQL: Databases with SQL", provider: "CS50", area: "Databases", hours: 40, url: "https://cs50.harvard.edu/sql/", prereqs: [], blurb: "Design, query and optimize relational databases.", units: ["Querying", "Relating", "Designing", "Writing", "Viewing", "Optimizing", "Scaling", "Final Project"] }),
  c({ id: "fcc-rwd", title: "Responsive Web Design", provider: "freeCodeCamp", area: "Frontend", hours: 300, url: "https://www.freecodecamp.org/learn/responsive-web-design-v9/", prereqs: [], blurb: "HTML, CSS, flexbox, grid and accessibility through projects.", units: ["Learn HTML by Building a Cat Photo App", "Learn Basic CSS by Building a Cafe Menu", "CSS Colors", "HTML Forms", "The Box Model", "CSS Flexbox", "Typography", "Accessibility", "CSS Grid", "Responsive Design", "Certification Projects"] }),
  c({ id: "fcc-js", title: "JavaScript Algorithms & Data Structures", provider: "freeCodeCamp", area: "Languages", hours: 300, url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/", prereqs: ["fcc-rwd"], blurb: "Core JavaScript, algorithmic thinking and OOP.", units: ["Basic JavaScript", "Arrays & Loops", "Objects", "Functions", "Regular Expressions", "Debugging", "Data Structures", "Algorithm Scripting", "OOP", "Functional Programming", "Certification Projects"] }),
  c({ id: "fcc-fe", title: "Front End Development Libraries", provider: "freeCodeCamp", area: "Frontend", hours: 300, url: "https://www.freecodecamp.org/learn/front-end-development-libraries/", prereqs: ["fcc-js"], blurb: "Bootstrap, jQuery, Sass, React and Redux.", units: ["Bootstrap", "jQuery", "Sass", "React", "Redux", "React & Redux", "Certification Projects"] }),
  c({ id: "fcc-be", title: "Back End Development and APIs", provider: "freeCodeCamp", area: "Backend", hours: 300, url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/", prereqs: ["fcc-js"], blurb: "Node.js, npm, Express and MongoDB.", units: ["Managing Packages with npm", "Basic Node and Express", "MongoDB and Mongoose", "Certification Projects"] }),
  c({ id: "fcc-rdb", title: "Relational Database", provider: "freeCodeCamp", area: "Databases", hours: 300, url: "https://www.freecodecamp.org/learn/relational-database/", prereqs: [], blurb: "Bash, Git, PostgreSQL and nano in a real VM.", units: ["Bash", "Relational Databases", "Bash Scripting", "SQL Joins", "Nano", "Git", "Certification Projects"] }),
  c({ id: "fcc-python", title: "Python", provider: "freeCodeCamp", area: "Languages", hours: 300, url: "https://www.freecodecamp.org/learn/python-v9/", prereqs: [], blurb: "Python fundamentals, data structures, OOP and algorithms through hands-on projects.", units: ["Python Basics", "Loops and Sequences", "Dictionaries and Sets", "Error Handling", "Classes and Objects", "Object-Oriented Programming", "Linear Data Structures", "Algorithms", "Graphs and Trees", "Dynamic Programming", "Certification Projects"] }),
  c({ id: "odin-foundations", title: "Foundations", provider: "The Odin Project", area: "Frontend", hours: 80, url: "https://www.theodinproject.com/paths/foundations/courses/foundations", prereqs: [], blurb: "Set up your environment, Git, HTML, CSS and JS basics.", units: ["Introduction", "Prerequisites & Setup", "Git Basics", "HTML Foundations", "CSS Foundations", "Flexbox", "JavaScript Basics", "DOM Manipulation", "Rock Paper Scissors", "Etch-a-Sketch", "Calculator"] }),
  c({ id: "odin-js", title: "JavaScript Path", provider: "The Odin Project", area: "Frontend", hours: 120, url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/javascript", prereqs: ["odin-foundations"], blurb: "OOP, modules, async JS, testing and project builds.", units: ["Organizing Your Code", "Objects & Classes", "Webpack & Modules", "Library Project", "Todo List", "Async JavaScript & APIs", "Weather App", "Testing with Jest", "Battleship"] }),
  c({ id: "odin-react", title: "React", provider: "The Odin Project", area: "Frontend", hours: 80, url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/react", prereqs: ["odin-js"], blurb: "Components, state, effects, routing and testing.", units: ["Getting Started", "Components & JSX", "State & Props", "Effects", "Class Components", "Testing", "React Router", "Shopping Cart Project"] }),
  c({ id: "odin-node", title: "NodeJS", provider: "The Odin Project", area: "Backend", hours: 120, url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs", prereqs: ["odin-js"], blurb: "Express, PostgreSQL, auth, APIs and Prisma.", units: ["Introduction to Node", "Express Basics", "Templates & Views", "PostgreSQL", "Authentication", "APIs", "Prisma ORM", "Members Only", "Blog API", "Messaging App"] }),
  c({ id: "boot-python", title: "Learn to Code in Python", provider: "boot.dev", area: "Languages", hours: 30, url: "https://www.boot.dev/courses/learn-code-python", prereqs: [], blurb: "Gamified Python from variables to errors.", units: ["Introduction", "Variables", "Functions", "Scope", "Testing & Debugging", "Computing", "Comparisons", "Loops", "Lists", "Dictionaries", "Sets", "Errors"] }),
  c({ id: "boot-linux", title: "Learn Linux", provider: "boot.dev", area: "DevOps", hours: 14, url: "https://www.boot.dev/courses/learn-linux", prereqs: [], blurb: "Terminals, filesystems, permissions and programs.", units: ["Terminals & Shells", "Filesystems", "Permissions", "Programs", "Input/Output", "Packages"] }),
  c({ id: "boot-git", title: "Learn Git", provider: "boot.dev", area: "DevOps", hours: 15, url: "https://www.boot.dev/courses/learn-git", prereqs: ["boot-linux"], blurb: "Repos, branches, merge, rebase and remotes.", units: ["Setup", "Repositories", "Internals", "Config", "Branching", "Merge", "Rebase", "Reset", "Remote", "GitHub", "Gitignore"] }),
  c({ id: "boot-oop", title: "Learn Object Oriented Programming", provider: "boot.dev", area: "CS Fundamentals", hours: 15, url: "https://www.boot.dev/courses/learn-object-oriented-programming-python", prereqs: ["boot-python"], blurb: "Classes, encapsulation, inheritance and polymorphism.", units: ["Clean Code", "Classes", "Encapsulation", "Abstraction", "Inheritance", "Polymorphism"] }),
  c({ id: "boot-dsa", title: "Learn Data Structures & Algorithms", provider: "boot.dev", area: "CS Fundamentals", hours: 35, url: "https://www.boot.dev/courses/learn-data-structures-and-algorithms-python", prereqs: ["boot-oop"], blurb: "Big-O, sorting, trees, graphs and P vs NP.", units: ["Algorithms Intro", "Math", "Big-O", "Sorting", "Exponential Time", "Data Structures", "Stacks & Queues", "Linked Lists", "Binary Trees", "Hashmaps", "Tries", "Graphs", "BFS & DFS", "P vs NP"] }),
  c({ id: "boot-go", title: "Learn Go", provider: "boot.dev", area: "Languages", hours: 30, url: "https://www.boot.dev/courses/learn-golang", prereqs: ["boot-python"], blurb: "Types, structs, interfaces, generics and concurrency.", units: ["Variables", "Conditionals", "Functions", "Structs", "Interfaces", "Errors", "Loops", "Slices", "Maps", "Pointers", "Channels", "Mutexes", "Generics"] }),
  c({ id: "boot-sql", title: "Learn SQL", provider: "boot.dev", area: "Databases", hours: 18, url: "https://www.boot.dev/courses/learn-sql", prereqs: [], blurb: "Tables, constraints, CRUD, joins and performance.", units: ["Introduction", "Tables", "Constraints", "CRUD", "Basic Queries", "Structuring", "Aggregations", "Subqueries", "Normalization", "Joins", "Performance"] }),
  c({ id: "boot-http", title: "Learn HTTP Servers in Go", provider: "boot.dev", area: "Backend", hours: 25, url: "https://www.boot.dev/courses/learn-http-servers-golang", prereqs: ["boot-go", "boot-sql"], blurb: "Build a production-style web server with auth and webhooks.", units: ["Servers", "Routing", "Architecture", "JSON", "Storage", "Authentication", "Authorization", "Webhooks", "Documentation"] }),
  c({ id: "boot-docker", title: "Learn Docker", provider: "boot.dev", area: "DevOps", hours: 10, url: "https://www.boot.dev/courses/learn-docker", prereqs: ["boot-linux"], blurb: "Containers, networks, Dockerfiles and publishing.", units: ["Install", "Command Line", "Networks", "Dockerfiles", "Publishing"] }),
  c({ id: "ex-js", title: "JavaScript Track", provider: "Exercism", area: "Languages", hours: 40, url: "https://exercism.org/tracks/javascript", prereqs: [], blurb: "Practice exercises with free human mentoring.", units: ["Basics", "Booleans & Numbers", "Strings", "Arrays", "Objects", "Closures", "Classes", "Promises", "Practice Exercises"] }),
  c({ id: "ex-ts", title: "TypeScript Track", provider: "Exercism", area: "Languages", hours: 30, url: "https://exercism.org/tracks/typescript", prereqs: ["ex-js"], blurb: "Type-safe JavaScript practice with mentoring.", units: ["Hello World", "Types & Inference", "Generics", "Unions & Narrowing", "Classes", "Practice Exercises"] }),
  c({ id: "ex-python", title: "Python Track", provider: "Exercism", area: "Languages", hours: 40, url: "https://exercism.org/tracks/python", prereqs: [], blurb: "Concept exercises and 140+ practice problems.", units: ["Basics", "Bools & Numbers", "Strings", "Lists & Tuples", "Dicts & Sets", "Loops", "Classes", "Generators", "Practice Exercises"] }),
  c({ id: "ex-rust", title: "Rust Track", provider: "Exercism", area: "Languages", hours: 50, url: "https://exercism.org/tracks/rust", prereqs: ["boot-go"], blurb: "Ownership, borrowing, traits and enums in practice.", units: ["Basics", "Ownership", "Structs", "Enums & Matching", "Traits", "Iterators", "Error Handling", "Practice Exercises"] }),
  c({ id: "rm-frontend", title: "Frontend Developer Roadmap", provider: "Roadmap.sh", area: "Frontend", hours: 40, url: "https://roadmap.sh/frontend", prereqs: ["odin-foundations"], blurb: "A community map of every frontend skill.", units: ["Internet Basics", "HTML", "CSS", "JavaScript", "Version Control", "Package Managers", "Frameworks", "Build Tools", "Testing", "Web Security", "Performance"] }),
  c({ id: "rm-backend", title: "Backend Developer Roadmap", provider: "Roadmap.sh", area: "Backend", hours: 40, url: "https://roadmap.sh/backend", prereqs: ["boot-sql"], blurb: "APIs, caching, auth, scaling and architecture.", units: ["Internet", "Pick a Language", "Version Control", "Relational Databases", "APIs", "Authentication", "Caching", "Web Security", "Testing", "CI/CD", "Architecture", "Scaling"] }),
  c({ id: "rm-postgres", title: "PostgreSQL DBA Roadmap", provider: "Roadmap.sh", area: "Databases", hours: 30, url: "https://roadmap.sh/postgresql-dba", prereqs: ["boot-sql"], blurb: "Indexes, query plans, replication and backups.", units: ["RDBMS Concepts", "Installation", "SQL Concepts", "Configuration", "Security", "Indexes", "Query Planning", "Replication", "Backups", "Monitoring"] }),
  c({ id: "rm-devops", title: "DevOps Roadmap", provider: "Roadmap.sh", area: "DevOps", hours: 40, url: "https://roadmap.sh/devops", prereqs: ["boot-docker"], blurb: "CI/CD, cloud, IaC, monitoring and more.", units: ["OS Concepts", "Networking", "Servers", "Containers", "Cloud Providers", "CI/CD", "Infrastructure as Code", "Monitoring", "Logging"] }),
  c({ id: "rm-cs", title: "Computer Science Roadmap", provider: "Roadmap.sh", area: "CS Fundamentals", hours: 60, url: "https://roadmap.sh/computer-science", prereqs: ["boot-dsa"], blurb: "Systems, networking, compilers and theory.", units: ["Data Structures", "Asymptotic Notation", "Common Algorithms", "Complexity Classes", "Processes & Threads", "Networking", "Databases", "Security", "System Design"] }),
];

export const COURSE_MAP = Object.fromEntries(COURSES.map((x) => [x.id, x])) as Record<string, Course>;
export const BASE_COURSES: Course[] = [...COURSES];

export interface Track { id: string; title: string; emoji: string; description: string; courses: string[] }

export const TRACKS: Track[] = [
  { id: "frontend", title: "Frontend Wizard", emoji: "🎨", description: "HTML, CSS, JavaScript and React — build gorgeous interfaces.", courses: ["odin-foundations", "fcc-rwd", "fcc-js", "ex-js", "odin-js", "odin-react", "ex-ts", "rm-frontend"] },
  { id: "backend", title: "Backend Builder", emoji: "⚙️", description: "Python, Go, SQL and servers — power the web from behind.", courses: ["boot-python", "boot-linux", "boot-git", "boot-sql", "boot-go", "boot-http", "boot-docker", "rm-backend"] },
  { id: "fullstack", title: "Full Stack Hero", emoji: "🦸", description: "Front to back with The Odin Project and friends.", courses: ["odin-foundations", "fcc-js", "odin-js", "odin-react", "boot-sql", "odin-node", "boot-docker", "rm-backend"] },
  { id: "game-development", title: "Game Development", emoji: "🎮", description: "From coding foundations to playable 2D games with Lua and LÖVE, then explore engines and game-development careers.", courses: ["cs50x", "cs50-games", "rm-game-dev"] },
  { id: "ui-ux", title: "UI/UX & Product Design", emoji: "✨", description: "Understand users and product goals, then turn ideas into polished interfaces and interactive Figma prototypes.", courses: ["rm-ux-design", "fcc-figma-ux", "fcc-figma-ui"] },
  { id: "data", title: "Database Pro", emoji: "🗄️", description: "SQL, PostgreSQL and data modeling mastery.", courses: ["boot-sql", "cs50sql", "fcc-rdb", "rm-postgres"] },
  { id: "cs", title: "Computer Science", emoji: "🧠", description: "Algorithms, data structures and systems from first principles.", courses: ["cs50x", "boot-python", "boot-oop", "boot-dsa", "cs50sql", "rm-cs"] },
];

export const BASE_TRACKS: Track[] = TRACKS.map((t) => ({ ...t }));

export interface CatalogRow { kind: string; id: string; data: unknown; hidden: boolean }

let lastRows: CatalogRow[] = [];
let userCourses: Course[] = [];

/** Rebuild COURSES / COURSE_MAP / TRACKS in place: built-in list + admin edits + the learner's own courses. */
export function applyCatalogRows(rows: CatalogRow[]) {
  lastRows = rows;
  const merge = <T extends { id: string }>(base: T[], kind: string) => {
    const out = new Map(base.map((x) => [x.id, x]));
    for (const r of rows.filter((x) => x.kind === kind)) {
      if (r.hidden) { out.delete(r.id); continue; }
      out.set(r.id, { ...(out.get(r.id) ?? {}), ...(r.data as object), id: r.id } as T);
    }
    return [...out.values()];
  };
  const shared = merge(BASE_COURSES, "course");
  const norm = (u: string) => u.trim().toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
  const byId = new Map(shared.map((c) => [c.id, c]));
  const byUrl = new Map(shared.map((c) => [norm(c.url), c]));
  // A learner course promoted into the catalog (same id or same link) appears only once, as the catalog entry.
  const aliases: Course[] = [];
  const own = userCourses.filter((u) => {
    const match = byId.get(u.id) ?? byUrl.get(norm(u.url));
    if (match && match.id !== u.id) aliases.push({ ...match, id: u.id });
    return !match;
  });
  COURSES.splice(0, COURSES.length, ...shared, ...own);
  for (const k of Object.keys(COURSE_MAP)) delete COURSE_MAP[k];
  for (const c of [...aliases, ...COURSES]) COURSE_MAP[c.id] = c;
  TRACKS.splice(0, TRACKS.length, ...merge(BASE_TRACKS, "track"));
}

export interface UserCourseRow { id: string; data: unknown }

/** Adds the learner's own courses (highlighted, no prerequisites) to the shared course list. */
export function applyUserCourses(rows: UserCourseRow[]) {
  userCourses = rows.map((r) => ({ prereqs: [], tags: [], ...(r.data as Partial<Course>), id: r.id, userAdded: true } as Course))
    .filter((c) => c.title && c.url && Array.isArray(c.units) && c.units.length > 0);
  applyCatalogRows(lastRows);
}
