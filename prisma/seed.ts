import { PrismaClient } from "../generated/prisma";
import { hashPassword } from "../lib/utils/server";
import {
  USER_ROLES,
  BOOK_GENRES,
  BOOK_STATUS,
  ISSUE_STATUS,
} from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Clearing existing data...");
  //   await prisma.bookIssue.deleteMany();
  //   await prisma.book.deleteMany();
  //   await prisma.user.deleteMany();
  //   await prisma.otp.deleteMany();

  // Create sample users
  console.log("👥 Creating sample users...");

  // Admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@bookmanager.com",
      password: adminPassword,
      role: USER_ROLES.ADMIN,
    },
  });

  // Librarian user
  const librarianPassword = await hashPassword("librarian123");
  const librarian = await prisma.user.create({
    data: {
      name: "Librarian User",
      email: "librarian@bookmanager.com",
      password: librarianPassword,
      role: USER_ROLES.LIBRARIAN,
    },
  });

  // Regular user
  const userPassword = await hashPassword("user123");
  const user = await prisma.user.create({
    data: {
      name: "Regular User",
      email: "user@bookmanager.com",
      password: userPassword,
      role: USER_ROLES.USER,
    },
  });

  // Additional regular users
  const user2Password = await hashPassword("user123");
  const user2 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@bookmanager.com",
      password: user2Password,
      role: USER_ROLES.USER,
    },
  });

  const user3Password = await hashPassword("user123");
  const user3 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@bookmanager.com",
      password: user3Password,
      role: USER_ROLES.USER,
    },
  });

  console.log("📚 Creating sample books...");

  // Sample books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "978-0743273565",
        rfidTag: "RFID001",
        genre: BOOK_GENRES.FICTION,
        publicationDate: new Date("1925-04-10"),
        description:
          "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
        totalCopies: 3,
        availableCopies: 2,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
    prisma.book.create({
      data: {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "978-0446310789",
        rfidTag: "RFID002",
        genre: BOOK_GENRES.FICTION,
        publicationDate: new Date("1960-07-11"),
        description:
          "The story of young Scout Finch and her father Atticus in a racially divided Alabama town.",
        totalCopies: 2,
        availableCopies: 1,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
    prisma.book.create({
      data: {
        title: "1984",
        author: "George Orwell",
        isbn: "978-0451524935",
        rfidTag: "RFID003",
        genre: BOOK_GENRES.SCIENCE_FICTION,
        publicationDate: new Date("1949-06-08"),
        description:
          "A dystopian novel about totalitarianism and surveillance society.",
        totalCopies: 4,
        availableCopies: 3,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
    prisma.book.create({
      data: {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "978-0547928241",
        rfidTag: "RFID004",
        genre: BOOK_GENRES.FICTION,
        publicationDate: new Date("1937-09-21"),
        description:
          "The adventure of Bilbo Baggins, a hobbit who embarks on a quest with thirteen dwarves.",
        totalCopies: 2,
        availableCopies: 0,
        status: BOOK_STATUS.ISSUED,
      },
    }),
    prisma.book.create({
      data: {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0553380163",
        rfidTag: "RFID005",
        genre: BOOK_GENRES.SCIENCE,
        publicationDate: new Date("1988-04-01"),
        description:
          "An exploration of cosmology and the universe's biggest mysteries.",
        totalCopies: 1,
        availableCopies: 1,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
    prisma.book.create({
      data: {
        title: "The Art of War",
        author: "Sun Tzu",
        isbn: "978-0140439199",
        rfidTag: "RFID006",
        genre: BOOK_GENRES.PHILOSOPHY,
        publicationDate: new Date("500-01-01"),
        description: "Ancient Chinese text on military strategy and tactics.",
        totalCopies: 3,
        availableCopies: 2,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
    prisma.book.create({
      data: {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        isbn: "978-0141439518",
        rfidTag: "RFID007",
        genre: BOOK_GENRES.ROMANCE,
        publicationDate: new Date("1813-01-28"),
        description:
          "A classic romance novel about the relationship between Elizabeth Bennet and Mr. Darcy.",
        totalCopies: 2,
        availableCopies: 1,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
    prisma.book.create({
      data: {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        isbn: "978-0307474278",
        rfidTag: "RFID008",
        genre: BOOK_GENRES.MYSTERY,
        publicationDate: new Date("2003-03-18"),
        description:
          "A mystery thriller involving a murder in the Louvre Museum and a religious mystery.",
        totalCopies: 3,
        availableCopies: 2,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
  ]);

  console.log("📖 Creating sample book issues...");

  // Sample book issues
  const bookIssues = await Promise.all([
    // User has borrowed "The Hobbit"
    prisma.bookIssue.create({
      data: {
        bookId: books[3].id, // The Hobbit
        userId: user.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: ISSUE_STATUS.ISSUED,
        otpCode: "123456",
        otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      },
    }),
    // User2 has borrowed "Pride and Prejudice"
    prisma.bookIssue.create({
      data: {
        bookId: books[6].id, // Pride and Prejudice
        userId: user2.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: ISSUE_STATUS.ISSUED,
        otpCode: "654321",
        otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      },
    }),
    // User3 has borrowed "The Da Vinci Code" and returned it
    prisma.bookIssue.create({
      data: {
        bookId: books[7].id, // The Da Vinci Code
        userId: user3.id,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        returnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: ISSUE_STATUS.RETURNED,
      },
    }),
  ]);

  // Update book availability based on issues
  await Promise.all([
    // Update The Hobbit - all copies issued
    prisma.book.update({
      where: { id: books[3].id },
      data: {
        availableCopies: 0,
        status: BOOK_STATUS.ISSUED,
      },
    }),
    // Update Pride and Prejudice - one copy issued
    prisma.book.update({
      where: { id: books[6].id },
      data: {
        availableCopies: 1,
      },
    }),
    // Update The Da Vinci Code - returned, so back to available
    prisma.book.update({
      where: { id: books[7].id },
      data: {
        availableCopies: 3,
        status: BOOK_STATUS.AVAILABLE,
      },
    }),
  ]);

  console.log("✅ Seed completed successfully!");
  console.log("\n📋 Sample Users Created:");
  console.log(`👑 Admin: admin@bookmanager.com (password: admin123)`);
  console.log(
    `📚 Librarian: librarian@bookmanager.com (password: librarian123)`
  );
  console.log(`👤 User: user@bookmanager.com (password: user123)`);
  console.log(`👤 User: john@bookmanager.com (password: user123)`);
  console.log(`👤 User: jane@bookmanager.com (password: user123)`);
  console.log("\n📚 Sample Books Created:", books.length);
  console.log("📖 Sample Book Issues Created:", bookIssues.length);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
