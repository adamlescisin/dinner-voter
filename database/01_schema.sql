-- ============================================================
-- Rodinné hlasování o večeři · MySQL schéma
-- Spusť v phpMyAdmin na Hostingeru
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+01:00';

-- ------------------------------------------------------------
-- Členové rodiny + jejich preference
-- ------------------------------------------------------------
CREATE TABLE members (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  -- Preference jako JSON pole řetězců
  likes         JSON         NOT NULL COMMENT 'Oblíbená jídla / kuchyně',
  dislikes      JSON         NOT NULL COMMENT 'Nesnášená jídla / ingredience',
  allergies     JSON         NOT NULL COMMENT 'Alergie',
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Denní hlasovací sezení
-- ------------------------------------------------------------
CREATE TABLE voting_sessions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  session_date  DATE         NOT NULL UNIQUE,
  -- AI návrhy jako JSON pole objektů {name, description, recipe_hint, emoji}
  proposals     JSON         NOT NULL,
  status        ENUM('open','closed') NOT NULL DEFAULT 'open',
  winner_name   VARCHAR(100) NULL COMMENT 'Vítěz po uzavření',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at     DATETIME     NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Hlasy členů rodiny
-- ------------------------------------------------------------
CREATE TABLE votes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  session_id    INT          NOT NULL,
  member_id     INT          NOT NULL,
  -- Buď index návrhu (0,1,2) nebo NULL pokud vlastní návrh
  proposal_index TINYINT     NULL,
  custom_dish   VARCHAR(200) NULL COMMENT 'Vlastní návrh člena',
  vote_token    VARCHAR(64)  NOT NULL UNIQUE COMMENT 'UUID token z emailu',
  voted_at      DATETIME     NULL COMMENT 'NULL = email odeslán, ale ještě nehlasoval',
  FOREIGN KEY (session_id) REFERENCES voting_sessions(id),
  FOREIGN KEY (member_id)  REFERENCES members(id),
  -- Každý člen může hlasovat jen jednou za sezení
  UNIQUE KEY unique_vote (session_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Index pro rychlé dotazy na historii
-- ------------------------------------------------------------
CREATE INDEX idx_sessions_date   ON voting_sessions(session_date);
CREATE INDEX idx_votes_token     ON votes(vote_token);
CREATE INDEX idx_votes_session   ON votes(session_id);
