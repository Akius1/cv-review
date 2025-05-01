// Create test users for demonstration
const testUsers = [
  {
    first_name: "John",
    last_name: "Applicant",
    email: "john@example.com",
    phone_number: "1234567890",
    password: "Password123",
    user_type: "applicant",
  },
  {
    first_name: "Jane",
    last_name: "Expert",
    email: "jane@example.com",
    phone_number: "0987654321",
    password: "Password123",
    user_type: "expert",
  },
];

// Function to create users
async function createTestUsers() {
  for (const user of testUsers) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      console.log(`Created user: ${user.email}`, data);
    } catch (error) {
      console.error(`Failed to create user: ${user.email}`, error);
    }
  }
}

// Call the function when the page loads
createTestUsers();
