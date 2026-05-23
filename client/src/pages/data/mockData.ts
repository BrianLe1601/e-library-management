export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string;
  rating: number;
  availableCopies: number;
  totalCopies: number;
  description: string;
  coverUrl: string;
  year: number;
  tags: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  date: string;
  badge: string;
}

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  userInitials: string;
  rating: number;
  comment: string;
  date: string;
}

export interface BorrowRecord {
  id: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  status: "Borrowing" | "Overdue" | "Returned";
  fineAmount: number;
}

export interface Notification {
  id: string;
  message: string;
  type: "warning" | "info" | "success" | "error";
  date: string;
  read: boolean;
}

const SCIENCE_IMG = "https://images.unsplash.com/photo-1748712576493-74f175750439?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
const PROGRAMMING_IMG = "https://images.unsplash.com/photo-1732304722020-be33345c00c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
const LITERATURE_IMG = "https://images.unsplash.com/photo-1759910546935-cfffa7aaf1fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
const MATH_IMG = "https://images.unsplash.com/photo-1758685733395-dba201403b4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
const AI_IMG = "https://images.unsplash.com/photo-1578910347624-202a5174601a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
const PHILOSOPHY_IMG = "https://images.unsplash.com/photo-1684350421489-dfd1a99b4e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export const books: Book[] = [
  {
    id: "1",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    publisher: "MIT Press",
    isbn: "978-0-262-03384-8",
    category: "IT",
    rating: 4.8,
    availableCopies: 3,
    totalCopies: 5,
    description: "A comprehensive introduction to the modern study of computer algorithms. It presents many algorithms and covers them in considerable depth, yet makes their design and analysis accessible to all levels of readers. Each chapter is relatively self-contained and can be used as a unit of study.",
    coverUrl: PROGRAMMING_IMG,
    year: 2009,
    tags: ["algorithms", "computer science", "programming"],
  },
  {
    id: "2",
    title: "Clean Code",
    author: "Robert C. Martin",
    publisher: "Prentice Hall",
    isbn: "978-0-132-35088-4",
    category: "IT",
    rating: 4.5,
    availableCopies: 2,
    totalCopies: 4,
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way.",
    coverUrl: AI_IMG,
    year: 2008,
    tags: ["software engineering", "best practices", "programming"],
  },
  {
    id: "3",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    publisher: "Scribner",
    isbn: "978-0-743-27356-5",
    category: "Literature",
    rating: 4.2,
    availableCopies: 5,
    totalCopies: 6,
    description: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted 'gin was the national drink and sex the national obsession.'",
    coverUrl: LITERATURE_IMG,
    year: 1925,
    tags: ["classic", "american literature", "novel"],
  },
  {
    id: "4",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    publisher: "J.B. Lippincott & Co.",
    isbn: "978-0-061-93558-7",
    category: "Literature",
    rating: 4.7,
    availableCopies: 1,
    totalCopies: 5,
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, To Kill A Mockingbird became both an instant bestseller and a critical success when it was first published in 1960.",
    coverUrl: PHILOSOPHY_IMG,
    year: 1960,
    tags: ["classic", "american literature", "justice"],
  },
  {
    id: "5",
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    publisher: "Bantam Books",
    isbn: "978-0-553-38016-3",
    category: "Science",
    rating: 4.9,
    availableCopies: 3,
    totalCopies: 3,
    description: "Was there a beginning of time? Could time run backwards? Is the universe infinite or does it have boundaries? These are just some of the questions considered in an internationally acclaimed masterpiece by one of the world's greatest thinkers.",
    coverUrl: SCIENCE_IMG,
    year: 1988,
    tags: ["physics", "cosmology", "space"],
  },
  {
    id: "6",
    title: "The Origin of Species",
    author: "Charles Darwin",
    publisher: "Oxford University Press",
    isbn: "978-0-198-53201-2",
    category: "Science",
    rating: 4.3,
    availableCopies: 2,
    totalCopies: 4,
    description: "Darwin's theory of natural selection issued a profound challenge to orthodox thought and belief: no being or species has been specifically created; all are locked into a pitiless struggle for existence, with extinction looming for those that fail to adapt.",
    coverUrl: MATH_IMG,
    year: 1859,
    tags: ["biology", "evolution", "natural science"],
  },
  {
    id: "7",
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    publisher: "Cengage Learning",
    isbn: "978-1-285-74155-0",
    category: "Mathematics",
    rating: 4.4,
    availableCopies: 6,
    totalCopies: 8,
    description: "James Stewart's calculus textbook is the best-seller in the world for a reason: clarity of exposition, accuracy of mathematics, and quality of problems. Students learn calculus the way mathematics should be learned.",
    coverUrl: MATH_IMG,
    year: 2015,
    tags: ["calculus", "mathematics", "analysis"],
  },
  {
    id: "8",
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell",
    publisher: "Pearson",
    isbn: "978-0-134-61099-3",
    category: "IT",
    rating: 4.8,
    availableCopies: 1,
    totalCopies: 4,
    description: "Artificial Intelligence: A Modern Approach, 4th Edition is intended for one or two-semester, undergraduate or graduate-level courses in Artificial Intelligence. The leading textbook in Artificial Intelligence, used in over 1500 universities worldwide.",
    coverUrl: AI_IMG,
    year: 2020,
    tags: ["AI", "machine learning", "computer science"],
  },
  {
    id: "9",
    title: "Philosophy of Mind",
    author: "Jaegwon Kim",
    publisher: "Wiley-Blackwell",
    isbn: "978-0-813-43444-4",
    category: "Philosophy",
    rating: 4.1,
    availableCopies: 3,
    totalCopies: 3,
    description: "This concise but comprehensive survey introduces students to the major issues and positions in philosophy of mind. The book covers the mind-body problem, mental causation, consciousness, intentionality, and cognitive architecture.",
    coverUrl: PHILOSOPHY_IMG,
    year: 2010,
    tags: ["philosophy", "mind", "consciousness"],
  },
  {
    id: "10",
    title: "Python Crash Course",
    author: "Eric Matthes",
    publisher: "No Starch Press",
    isbn: "978-1-718-50270-5",
    category: "IT",
    rating: 4.6,
    availableCopies: 4,
    totalCopies: 6,
    description: "Python Crash Course is a fast-paced, thorough introduction to programming with Python that will have you writing programs, solving problems, and making things that work in no time. In the first half of the book, you'll learn about basic programming concepts.",
    coverUrl: PROGRAMMING_IMG,
    year: 2019,
    tags: ["python", "programming", "beginner"],
  },
  {
    id: "11",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    publisher: "Farrar, Straus and Giroux",
    isbn: "978-0-374-27563-1",
    category: "Science",
    rating: 4.7,
    availableCopies: 2,
    totalCopies: 5,
    description: "In the international bestseller, Thinking, Fast and Slow, Daniel Kahneman, the renowned psychologist and winner of the Nobel Prize in Economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.",
    coverUrl: SCIENCE_IMG,
    year: 2011,
    tags: ["psychology", "behavioral economics", "cognition"],
  },
  {
    id: "12",
    title: "Linear Algebra Done Right",
    author: "Sheldon Axler",
    publisher: "Springer",
    isbn: "978-3-319-11079-0",
    category: "Mathematics",
    rating: 4.6,
    availableCopies: 4,
    totalCopies: 5,
    description: "This best-selling textbook for a second course in linear algebra is aimed at undergrad math majors and graduate students. The novel approach taken here banishes determinants to the end of the book and focuses on understanding the structure of linear operators.",
    coverUrl: MATH_IMG,
    year: 2015,
    tags: ["linear algebra", "mathematics", "advanced"],
  },
  {
    id: "13",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    publisher: "Oxford University Press",
    isbn: "978-0-140-44913-6",
    category: "Literature",
    rating: 4.5,
    availableCopies: 0,
    totalCopies: 4,
    description: "Raskolnikov, a destitute and desperate former student, wanders through the slums of St. Petersburg and commits a random murder without remorse or regret. He imagines himself to be a great man, a Napoleon: acting for a higher purpose beyond conventional moral law.",
    coverUrl: LITERATURE_IMG,
    year: 1866,
    tags: ["classic", "russian literature", "psychology"],
  },
  {
    id: "14",
    title: "Data Structures and Algorithms",
    author: "Michael T. Goodrich",
    publisher: "NXB Tre",
    isbn: "978-1-118-80509-0",
    category: "IT",
    rating: 4.3,
    availableCopies: 5,
    totalCopies: 7,
    description: "This sixth edition of Data Structures and Algorithms in Java continues its tradition of innovation and excellence, providing a thorough analysis of data structures and algorithms using a consistent object-oriented framework.",
    coverUrl: PROGRAMMING_IMG,
    year: 2014,
    tags: ["data structures", "algorithms", "java"],
  },
  {
    id: "15",
    title: "The Republic",
    author: "Plato",
    publisher: "Oxford University Press",
    isbn: "978-0-199-51101-5",
    category: "Philosophy",
    rating: 4.4,
    availableCopies: 2,
    totalCopies: 3,
    description: "The Republic is Plato's masterwork. It is in essence a discussion of the nature of justice, and asks whether the just man is happier than the unjust man. Socrates argues that justice in the state is analogous to justice in the individual man.",
    coverUrl: PHILOSOPHY_IMG,
    year: -380,
    tags: ["philosophy", "politics", "ancient greece"],
  },
  {
    id: "16",
    title: "Quantum Mechanics",
    author: "David J. Griffiths",
    publisher: "Cambridge University Press",
    isbn: "978-1-107-18963-8",
    category: "Science",
    rating: 4.8,
    availableCopies: 2,
    totalCopies: 4,
    description: "Changes and additions to the new edition of this classic textbook include a new chapter on symmetries, new problems and examples, improved explanations, more numerical problems to be worked on a computer, and independent sections for students to test understanding.",
    coverUrl: SCIENCE_IMG,
    year: 2018,
    tags: ["physics", "quantum", "science"],
  },
];

export const newsItems: NewsItem[] = [
  {
    id: "n1",
    title: "New Digital Collection: 10,000+ E-Books Added",
    subtitle: "Expand Your Knowledge",
    description: "We are thrilled to announce the addition of over 10,000 new digital titles to our library collection, spanning science, technology, literature, and humanities. Available immediately for all registered members.",
    imageUrl: "https://images.unsplash.com/photo-1524591282491-edb48a0fca8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    date: "May 5, 2026",
    badge: "New Collection",
  },
  {
    id: "n2",
    title: "Annual Academic Excellence Awards 2026",
    subtitle: "Celebrating Outstanding Research",
    description: "The E-Library is proud to host the Annual Academic Excellence Awards, recognizing outstanding contributions in research and scholarship across all disciplines. Join us in celebrating academic achievement.",
    imageUrl: "https://images.unsplash.com/photo-1770307939909-f27b8e4ae9c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    date: "April 28, 2026",
    badge: "Event",
  },
  {
    id: "n3",
    title: "Summer Reading Program: Enroll Now",
    subtitle: "Read, Learn, Grow",
    description: "Our popular Summer Reading Program returns with exciting new challenges, reading lists, and rewards. Earn badges and exclusive library privileges by completing reading milestones this summer.",
    imageUrl: "https://images.unsplash.com/photo-1658200543015-cd38d8f25455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    date: "April 15, 2026",
    badge: "Program",
  },
];

export const reviews: Review[] = [
  { id: "r1", bookId: "8", userName: "Alice Johnson", userInitials: "AJ", rating: 5, comment: "An excellent comprehensive guide to AI. Covers all fundamental topics thoroughly. A must-read for anyone entering the field.", date: "April 12, 2026" },
  { id: "r2", bookId: "8", userName: "Marcus Chen", userInitials: "MC", rating: 4, comment: "Very detailed and well-written. The exercises are challenging but rewarding. I particularly liked the chapters on neural networks.", date: "March 28, 2026" },
  { id: "r3", bookId: "8", userName: "Priya Patel", userInitials: "PP", rating: 5, comment: "Russell's writing is clear and accessible. This is the definitive textbook for AI. I recommend it to every CS student.", date: "March 10, 2026" },
  { id: "r4", bookId: "8", userName: "David Kim", userInitials: "DK", rating: 4, comment: "Great book overall, though some chapters get quite dense. The new edition includes very relevant updates on deep learning.", date: "February 22, 2026" },
  { id: "r1b", bookId: "1", userName: "Sophie Turner", userInitials: "ST", rating: 5, comment: "The bible of algorithms. Every computer scientist needs this on their shelf. Incredibly comprehensive.", date: "April 20, 2026" },
  { id: "r2b", bookId: "1", userName: "James Wilson", userInitials: "JW", rating: 4, comment: "Dense but rewarding. Takes time to work through but the depth of coverage is unmatched.", date: "March 15, 2026" },
];

export interface HistoryRecord {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  borrowDate: string;   // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  returnedDate: string; // YYYY-MM-DD
  condition: "on-time" | "late";
  finePaid: number;
  userRating?: number;  // 1-5, undefined = not yet rated
}

export const historyRecords: HistoryRecord[] = [
  { id: "h1",  title: "The Great Gatsby",                       author: "F. Scott Fitzgerald",   category: "Literature",   coverUrl: LITERATURE_IMG,   borrowDate: "2025-09-01", dueDate: "2025-09-15", returnedDate: "2025-09-14", condition: "on-time", finePaid: 0,    userRating: 4 },
  { id: "h2",  title: "Crime and Punishment",                   author: "Fyodor Dostoevsky",     category: "Literature",   coverUrl: LITERATURE_IMG,   borrowDate: "2025-09-20", dueDate: "2025-10-04", returnedDate: "2025-10-06", condition: "late",    finePaid: 0.50, userRating: 5 },
  { id: "h3",  title: "Calculus: Early Transcendentals",        author: "James Stewart",         category: "Mathematics",  coverUrl: MATH_IMG,         borrowDate: "2025-10-10", dueDate: "2025-10-24", returnedDate: "2025-10-23", condition: "on-time", finePaid: 0 },
  { id: "h4",  title: "Introduction to Algorithms",             author: "Thomas H. Cormen",      category: "IT",           coverUrl: PROGRAMMING_IMG,  borrowDate: "2025-10-28", dueDate: "2025-11-11", returnedDate: "2025-11-11", condition: "on-time", finePaid: 0,    userRating: 5 },
  { id: "h5",  title: "Clean Code",                             author: "Robert C. Martin",      category: "IT",           coverUrl: AI_IMG,           borrowDate: "2025-11-15", dueDate: "2025-11-29", returnedDate: "2025-12-01", condition: "late",    finePaid: 1.00, userRating: 4 },
  { id: "h6",  title: "The Republic",                           author: "Plato",                 category: "Philosophy",   coverUrl: PHILOSOPHY_IMG,   borrowDate: "2025-12-05", dueDate: "2025-12-19", returnedDate: "2025-12-19", condition: "on-time", finePaid: 0,    userRating: 4 },
  { id: "h7",  title: "A Brief History of Time",                author: "Stephen Hawking",       category: "Science",      coverUrl: SCIENCE_IMG,      borrowDate: "2026-01-10", dueDate: "2026-01-24", returnedDate: "2026-01-22", condition: "on-time", finePaid: 0,    userRating: 5 },
  { id: "h8",  title: "Philosophy of Mind",                     author: "Jaegwon Kim",           category: "Philosophy",   coverUrl: PHILOSOPHY_IMG,   borrowDate: "2026-02-01", dueDate: "2026-02-15", returnedDate: "2026-02-20", condition: "late",    finePaid: 2.50 },
  { id: "h9",  title: "To Kill a Mockingbird",                  author: "Harper Lee",            category: "Literature",   coverUrl: LITERATURE_IMG,   borrowDate: "2026-02-25", dueDate: "2026-03-11", returnedDate: "2026-03-11", condition: "on-time", finePaid: 0,    userRating: 4 },
  { id: "h10", title: "Python Crash Course",                    author: "Eric Matthes",          category: "IT",           coverUrl: PROGRAMMING_IMG,  borrowDate: "2026-03-15", dueDate: "2026-03-29", returnedDate: "2026-03-28", condition: "on-time", finePaid: 0 },
  { id: "h11", title: "Data Structures and Algorithms",         author: "Michael T. Goodrich",   category: "IT",           coverUrl: PROGRAMMING_IMG,  borrowDate: "2026-04-01", dueDate: "2026-04-15", returnedDate: "2026-04-15", condition: "on-time", finePaid: 0,    userRating: 4 },
  { id: "h12", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell",   category: "IT",           coverUrl: AI_IMG,           borrowDate: "2026-04-25", dueDate: "2026-05-09", returnedDate: "2026-05-11", condition: "late",    finePaid: 2.50 },
  { id: "h13", title: "Quantum Mechanics",                      author: "David J. Griffiths",    category: "Science",      coverUrl: SCIENCE_IMG,      borrowDate: "2026-01-05", dueDate: "2026-01-19", returnedDate: "2026-01-19", condition: "on-time", finePaid: 0,    userRating: 5 },
  { id: "h14", title: "The Origin of Species",                  author: "Charles Darwin",        category: "Science",      coverUrl: MATH_IMG,         borrowDate: "2025-11-01", dueDate: "2025-11-15", returnedDate: "2025-11-18", condition: "late",    finePaid: 1.50 },
  { id: "h15", title: "Linear Algebra Done Right",              author: "Sheldon Axler",         category: "Mathematics",  coverUrl: MATH_IMG,         borrowDate: "2025-08-10", dueDate: "2025-08-24", returnedDate: "2025-08-24", condition: "on-time", finePaid: 0,    userRating: 4 },
];

export const borrowHistory: BorrowRecord[] = [
  { id: "b1", bookTitle: "Introduction to Algorithms", borrowDate: "2026-04-01", dueDate: "2026-04-15", status: "Returned", fineAmount: 0 },
  { id: "b2", bookTitle: "Clean Code", borrowDate: "2026-04-10", dueDate: "2026-04-24", status: "Returned", fineAmount: 0 },
  { id: "b3", bookTitle: "Artificial Intelligence: A Modern Approach", borrowDate: "2026-04-25", dueDate: "2026-05-09", status: "Overdue", fineAmount: 2.50 },
  { id: "b4", bookTitle: "Python Crash Course", borrowDate: "2026-05-01", dueDate: "2026-05-15", status: "Borrowing", fineAmount: 0 },
  { id: "b5", bookTitle: "A Brief History of Time", borrowDate: "2026-03-10", dueDate: "2026-03-24", status: "Returned", fineAmount: 0 },
  { id: "b6", bookTitle: "The Great Gatsby", borrowDate: "2026-03-20", dueDate: "2026-04-03", status: "Returned", fineAmount: 1.00 },
];

export const notifications: Notification[] = [
  { id: "notif1", message: "Python Crash Course is due in 5 days. Please return or renew.", type: "warning", date: "May 10, 2026", read: false },
  { id: "notif2", message: "Your reservation for 'Crime and Punishment' is now available for pickup.", type: "success", date: "May 9, 2026", read: false },
  { id: "notif3", message: "Overdue notice: 'Artificial Intelligence: A Modern Approach' was due on May 9. A fine of $2.50 has been charged.", type: "error", date: "May 9, 2026", read: false },
  { id: "notif4", message: "New books added to the IT category. Check out the latest additions!", type: "info", date: "May 7, 2026", read: true },
  { id: "notif5", message: "Your extension request for 'Clean Code' has been approved.", type: "success", date: "May 5, 2026", read: true },
  { id: "notif6", message: "Reminder: Library will be closed on May 12 for scheduled maintenance.", type: "info", date: "May 3, 2026", read: true },
];

export interface CurrentlyBorrowed {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  renewalCount: number;
  maxRenewals: number;
}

// Today's date anchor: 2026-05-21
export const currentlyBorrowed: CurrentlyBorrowed[] = [
  {
    id: "cb1",
    title: "Python Crash Course",
    author: "Eric Matthes",
    category: "IT",
    coverUrl: PROGRAMMING_IMG,
    borrowDate: "2026-05-08",
    dueDate: "2026-05-22",
    renewalCount: 1,
    maxRenewals: 2,
  },
  {
    id: "cb2",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Science",
    coverUrl: SCIENCE_IMG,
    borrowDate: "2026-05-12",
    dueDate: "2026-06-05",
    renewalCount: 0,
    maxRenewals: 2,
  },
  {
    id: "cb3",
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell",
    category: "IT",
    coverUrl: AI_IMG,
    borrowDate: "2026-04-25",
    dueDate: "2026-05-09",
    renewalCount: 2,
    maxRenewals: 2,
  },
  {
    id: "cb4",
    title: "Linear Algebra Done Right",
    author: "Sheldon Axler",
    category: "Mathematics",
    coverUrl: MATH_IMG,
    borrowDate: "2026-05-01",
    dueDate: "2026-05-28",
    renewalCount: 0,
    maxRenewals: 2,
  },
];

export interface SavedBook {
  id: string;
  bookId: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  rating: number;
  availableCopies: number;
  totalCopies: number;
  expectedBackDate?: string; // shown when availableCopies === 0
  savedDate: string; // YYYY-MM-DD
}

export const savedBooks: SavedBook[] = [
  {
    id: "sv1",
    bookId: "3",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Literature",
    coverUrl: LITERATURE_IMG,
    rating: 4.2,
    availableCopies: 5,
    totalCopies: 6,
    savedDate: "2026-05-18",
  },
  {
    id: "sv2",
    bookId: "13",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    category: "Literature",
    coverUrl: LITERATURE_IMG,
    rating: 4.5,
    availableCopies: 0,
    totalCopies: 4,
    expectedBackDate: "2026-06-03",
    savedDate: "2026-05-15",
  },
  {
    id: "sv3",
    bookId: "7",
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    category: "Mathematics",
    coverUrl: MATH_IMG,
    rating: 4.4,
    availableCopies: 6,
    totalCopies: 8,
    savedDate: "2026-05-12",
  },
  {
    id: "sv4",
    bookId: "9",
    title: "Philosophy of Mind",
    author: "Jaegwon Kim",
    category: "Philosophy",
    coverUrl: PHILOSOPHY_IMG,
    rating: 4.1,
    availableCopies: 0,
    totalCopies: 3,
    expectedBackDate: "2026-05-28",
    savedDate: "2026-05-10",
  },
  {
    id: "sv5",
    bookId: "16",
    title: "Quantum Mechanics",
    author: "David J. Griffiths",
    category: "Science",
    coverUrl: SCIENCE_IMG,
    rating: 4.8,
    availableCopies: 2,
    totalCopies: 4,
    savedDate: "2026-05-05",
  },
  {
    id: "sv6",
    bookId: "15",
    title: "The Republic",
    author: "Plato",
    category: "Philosophy",
    coverUrl: PHILOSOPHY_IMG,
    rating: 4.4,
    availableCopies: 2,
    totalCopies: 3,
    savedDate: "2026-04-28",
  },
  {
    id: "sv7",
    bookId: "4",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Literature",
    coverUrl: LITERATURE_IMG,
    rating: 4.7,
    availableCopies: 1,
    totalCopies: 5,
    savedDate: "2026-04-20",
  },
  {
    id: "sv8",
    bookId: "1",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    category: "IT",
    coverUrl: PROGRAMMING_IMG,
    rating: 4.8,
    availableCopies: 0,
    totalCopies: 5,
    expectedBackDate: "2026-06-10",
    savedDate: "2026-04-14",
  },
];

export const categories = ["Literature", "Science", "IT", "Mathematics", "Philosophy", "History", "Economics", "Psychology"];
export const publishers = ["MIT Press", "Oxford University Press", "Pearson", "NXB Tre", "Cambridge University Press", "Springer", "No Starch Press", "Scribner"];
export const authors = ["Thomas H. Cormen", "Robert C. Martin", "Stuart Russell", "Stephen Hawking", "James Stewart", "Eric Matthes", "Fyodor Dostoevsky", "Plato"];
