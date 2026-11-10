export const KNOWN_PROVIDERS = ["boot.dev", "freeCodeCamp", "Exercism", "The Odin Project", "CS50", "Roadmap.sh"];
export const KNOWN_AREAS = ["Languages", "Frontend", "Backend", "Databases", "CS Fundamentals", "DevOps"];
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
  c({ id: "cs50x", title: "CS50x: Introduction to Computer Science", provider: "CS50", area: "CS Fundamentals", hours: 100, url: "https://cs50.harvard.edu/x/", prereqs: [], blurb: "Harvard's legendary intro: C, algorithms, memory, Python, SQL and the web.", units: ["Week 0: Scratch", "Week 1: C", "Week 2: Arrays", "Week 3: Algorithms", "Week 4: Memory", "Week 5: Data Structures", "Week 6: Python", "Week 7: SQL", "Week 8: HTML, CSS, JavaScript", "Week 9: Flask", "Final Project"] }),
  c({ id: "cs50p", title: "CS50P: Programming with Python", provider: "CS50", area: "Languages", hours: 60, url: "https://cs50.harvard.edu/python/", prereqs: [], blurb: "Learn Python from functions to OOP with problem sets.", units: ["Functions & Variables", "Conditionals", "Loops", "Exceptions", "Libraries", "Unit Tests", "File I/O", "Regular Expressions", "Object-Oriented Programming", "Final Project"] }),
  c({ id: "cs50w", title: "CS50W: Web Programming with Python & JS", provider: "CS50", area: "Backend", hours: 80, url: "https://cs50.harvard.edu/web/", prereqs: ["cs50x"], blurb: "Django, JavaScript, SQL, testing and scalability.", units: ["HTML & CSS", "Git", "Python", "Django", "SQL, Models & Migrations", "JavaScript", "User Interfaces", "Testing & CI/CD", "Scalability & Security", "Capstone"] }),
  c({ id: "cs50sql", title: "CS50 SQL: Databases with SQL", provider: "CS50", area: "Databases", hours: 40, url: "https://cs50.harvard.edu/sql/", prereqs: [], blurb: "Design, query and optimize relational databases.", units: ["Querying", "Relating", "Designing", "Writing", "Viewing", "Optimizing", "Scaling", "Final Project"] }),
  c({ id: "fcc-rwd", title: "Responsive Web Design", provider: "freeCodeCamp", area: "Frontend", hours: 300, url: "https://www.freecodecamp.org/learn/responsive-web-design-v9/", prereqs: [], blurb: "HTML, CSS, flexbox, grid and accessibility through projects.", units: ["Learn HTML by Building a Cat Photo App", "Learn Basic CSS by Building a Cafe Menu", "CSS Colors", "HTML Forms", "The Box Model", "CSS Flexbox", "Typography", "Accessibility", "CSS Grid", "Responsive Design", "Certification Projects"] }),
  c({ id: "fcc-js", title: "JavaScript Algorithms & Data Structures", provider: "freeCodeCamp", area: "Languages", hours: 300, url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/", prereqs: ["fcc-rwd"], blurb: "Core JavaScript, algorithmic thinking and OOP.", units: ["Basic JavaScript", "Arrays & Loops", "Objects", "Functions", "Regular Expressions", "Debugging", "Data Structures", "Algorithm Scripting", "OOP", "Functional Programming", "Certification Projects"] }),
  c({ id: "fcc-fe", title: "Front End Development Libraries", provider: "freeCodeCamp", area: "Frontend", hours: 300, url: "https://www.freecodecamp.org/learn/front-end-development-libraries/", prereqs: ["fcc-js"], blurb: "Bootstrap, jQuery, Sass, React and Redux.", units: ["Bootstrap", "jQuery", "Sass", "React", "Redux", "React & Redux", "Certification Projects"] }),
  c({ id: "fcc-be", title: "Back End Development and APIs", provider: "freeCodeCamp", area: "Backend", hours: 300, url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/", prereqs: ["fcc-js"], blurb: "Node.js, npm, Express and MongoDB.", units: ["Managing Packages with npm", "Basic Node and Express", "MongoDB and Mongoose", "Certification Projects"] }),
  c({ id: "fcc-rdb", title: "Relational Database", provider: "freeCodeCamp", area: "Databases", hours: 300, url: "https://www.freecodecamp.org/learn/relational-database/", prereqs: [], blurb: "Bash, Git, PostgreSQL and nano in a real VM.", units: ["Bash", "Relational Databases", "Bash Scripting", "SQL Joins", "Nano", "Git", "Certification Projects"] }),
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
  { id: "cs", title: "Computer Science", emoji: "🧠", description: "Algorithms, data structures and systems from first principles.", courses: ["cs50x", "boot-python", "boot-oop", "boot-dsa", "cs50sql", "rm-cs"] },
  { id: "data", title: "Database Pro", emoji: "🗄️", description: "SQL, PostgreSQL and data modeling mastery.", courses: ["boot-sql", "cs50sql", "fcc-rdb", "rm-postgres"] },
];

export const BASE_TRACKS: Track[] = TRACKS.map((t) => ({ ...t }));

export interface CatalogRow { kind: string; id: string; data: unknown; hidden: boolean }

/** Rebuild COURSES / COURSE_MAP / TRACKS in place: built-in list + admin edits stored in the database. */
export function applyCatalogRows(rows: CatalogRow[]) {
  const merge = <T extends { id: string }>(base: T[], kind: string) => {
    const out = new Map(base.map((x) => [x.id, x]));
    for (const r of rows.filter((x) => x.kind === kind)) {
      if (r.hidden) { out.delete(r.id); continue; }
      out.set(r.id, { ...(out.get(r.id) ?? {}), ...(r.data as object), id: r.id } as T);
    }
    return [...out.values()];
  };
  COURSES.splice(0, COURSES.length, ...merge(BASE_COURSES, "course"));
  for (const k of Object.keys(COURSE_MAP)) delete COURSE_MAP[k];
  for (const c of COURSES) COURSE_MAP[c.id] = c;
  TRACKS.splice(0, TRACKS.length, ...merge(BASE_TRACKS, "track"));
}
