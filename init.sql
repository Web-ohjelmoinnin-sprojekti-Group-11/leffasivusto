-- Kättäjät
CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ryhmät
CREATE TABLE "Group" (
    group_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ryhmän jäsenet
CREATE TABLE GroupMembers (
    user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
    group_id INT REFERENCES "Group"(group_id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member','admin')) DEFAULT 'member',
    PRIMARY KEY (user_id, group_id)
);

-- Arvostelut
CREATE TABLE Review (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,  -- tulee sielt toiselt sivult kai
    rating INT CHECK (rating BETWEEN 1 AND 5),
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Näytösajat
CREATE TABLE Showtime (
    showtime_id SERIAL PRIMARY KEY,
    movie_id TEXT NOT NULL, -- ulkoisen lähteen tunniste
    theatre TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL
);

-- Suosikit
CREATE TABLE FavoriteList (
    favorite_list_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- Suosikkilistan sisältö
CREATE TABLE FavoriteListMovie (
    favorite_list_id INT REFERENCES FavoriteList(favorite_list_id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    PRIMARY KEY (favorite_list_id, movie_id)
);

-- Ryhmän sisältö
CREATE TABLE GroupContent (
    content_id SERIAL PRIMARY KEY,
    group_id INT REFERENCES "Group"(group_id) ON DELETE CASCADE,
    user_id INT REFERENCES "User"(user_id) ON DELETE CASCADE,
    review_id INT REFERENCES Review(review_id) ON DELETE SET NULL,
    text TEXT,
    role TEXT
);
