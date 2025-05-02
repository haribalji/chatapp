import { faker } from "@faker-js/faker";
import { User } from "../models/user.js";

const createUser = async (numUsers) => {
  try {
    const usersPromise = [];

    for (let i = 0; i < numUsers; i++) {
        const tempUser = User.create({
          name: faker.person.fullName(),        // e.g., "John Doe"
          username: faker.internet.userName(),  // e.g., "john_doe92"
          bio: faker.lorem.sentence(10),        // e.g., "I love coding in my free time."
          password: "password",                 // Default password for all (for dev only)
          avatar: {
            url: faker.image.avatar(),          // e.g., fake image URL
            public_id: faker.system.fileName(), // e.g., "avatar123.jpg"
          },
        });
      usersPromise.push(tempUser);
    }

    await Promise.all(usersPromise);
    //   Efficiently creates all users in parallel.

    console.log("Users created", numUsers);
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export { createUser };