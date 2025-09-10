-- käyttäjät
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ryhmät
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ryhmän jäsenet
CREATE TABLE group_members (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(group_id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member','admin')) DEFAULT 'member',
    PRIMARY KEY (user_id, group_id)
);

-- arvostelut
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,  -- ulkoinen sivu
    rating INT CHECK (rating BETWEEN 1 AND 5),
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- näytösajat
CREATE TABLE showtimes (
    showtime_id SERIAL PRIMARY KEY,
    movie_id TEXT NOT NULL, -- ulkoisen lähteen tunniste
    theatre TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL
);

-- suosikkilistat
CREATE TABLE favorite_lists (
    favorite_list_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- suosikkilistan sisältö
CREATE TABLE favorite_list_movies (
    favorite_list_id INT REFERENCES favorite_lists(favorite_list_id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    PRIMARY KEY (favorite_list_id, movie_id)
);

-- ryhmän sisältö
CREATE TABLE group_content (
    content_id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    review_id INT REFERENCES reviews(review_id) ON DELETE SET NULL,
    text TEXT,
    role TEXT
);

