-- ================================================
-- SCHEMA COMPLETO PARA LIGA DE VOLEIBOL DE PLAYA
-- Supabase PostgreSQL Database
-- VERSIÓN FINAL CORREGIDA
-- ================================================

-- EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLA: PLAYERS (Jugadores)
-- ================================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(8) UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(1) CHECK (genero IN ('M', 'F')) NOT NULL,
    categoria VARCHAR(4) CHECK (categoria IN ('U13', 'U15', 'U17', 'U19')),
    ranking_points_total INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_genero_categoria ON players(genero, categoria);
CREATE INDEX idx_players_ranking ON players(ranking_points_total DESC);
CREATE INDEX idx_players_dni ON players(dni);

-- ================================================
-- TABLA: TOURNAMENTS (Torneos/Etapas)
-- ================================================
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    sede VARCHAR(100),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    categoria VARCHAR(4) CHECK (categoria IN ('U13', 'U15', 'U17', 'U19')) NOT NULL,
    genero VARCHAR(1) CHECK (genero IN ('M', 'F')) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('inscripcion', 'grupos', 'playoffs', 'finalizado')) DEFAULT 'inscripcion',
    numero_grupos INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_estado ON tournaments(estado);
CREATE INDEX idx_tournaments_categoria_genero ON tournaments(categoria, genero);

-- ================================================
-- TABLA: TEAMS (Duplas/Equipos)
-- ================================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    player2_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    seed_points INTEGER NOT NULL DEFAULT 0,
    seed_number INTEGER,
    posicion_final INTEGER,
    puntos_ganados INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT different_players CHECK (player1_id != player2_id),
    CONSTRAINT unique_team_per_tournament UNIQUE(tournament_id, player1_id, player2_id)
);

CREATE INDEX idx_teams_tournament ON teams(tournament_id);
CREATE INDEX idx_teams_seed ON teams(seed_points DESC);

-- ================================================
-- TABLA: GROUPS (Grupos)
-- ================================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_group_per_tournament UNIQUE(tournament_id, name)
);

CREATE INDEX idx_groups_tournament ON groups(tournament_id);

-- ================================================
-- TABLA: TEAM_GROUPS (Relación Many-to-Many)
-- ================================================
CREATE TABLE team_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_team_in_group UNIQUE(team_id, group_id)
);

CREATE INDEX idx_team_groups_team ON team_groups(team_id);
CREATE INDEX idx_team_groups_group ON team_groups(group_id);

-- ================================================
-- TABLA: MATCHES (Partidos)
-- ================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    fase VARCHAR(20) CHECK (fase IN ('grupos', 'cuartos', 'semifinal', 'tercer_lugar', 'final')) NOT NULL,
    set1_score_a INTEGER,
    set1_score_b INTEGER,
    set2_score_a INTEGER,
    set2_score_b INTEGER,
    set3_score_a INTEGER,
    set3_score_b INTEGER,
    winner_id UUID REFERENCES teams(id),
    status VARCHAR(20) CHECK (status IN ('pendiente', 'en_vivo', 'finalizado')) DEFAULT 'pendiente',
    cancha VARCHAR(20),
    fecha_hora TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT different_teams CHECK (team_a_id != team_b_id)
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_group ON matches(group_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_fase ON matches(fase);

-- ================================================
-- TABLA: STANDINGS (Tabla de Posiciones)
-- ================================================
CREATE TABLE standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    partidos_jugados INTEGER DEFAULT 0,
    partidos_ganados INTEGER DEFAULT 0,
    partidos_perdidos INTEGER DEFAULT 0,
    sets_favor INTEGER DEFAULT 0,
    sets_contra INTEGER DEFAULT 0,
    puntos_favor INTEGER DEFAULT 0,
    puntos_contra INTEGER DEFAULT 0,
    ratio_sets DECIMAL(10, 3) DEFAULT 0,
    ratio_puntos DECIMAL(10, 3) DEFAULT 0,
    posicion INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_team_standing UNIQUE(group_id, team_id)
);

CREATE INDEX idx_standings_group ON standings(group_id);
CREATE INDEX idx_standings_position ON standings(posicion);

-- ================================================
-- TABLA: RANKING_HISTORY (Historial de Puntos)
-- ================================================
CREATE TABLE ranking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    posicion INTEGER NOT NULL,
    puntos_ganados INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ranking_history_player ON ranking_history(player_id);
CREATE INDEX idx_ranking_history_tournament ON ranking_history(tournament_id);

-- ================================================
-- FUNCIONES
-- ================================================

-- Función para calcular categoría
CREATE OR REPLACE FUNCTION calculate_categoria(fecha_nac DATE)
RETURNS VARCHAR(4) AS $$
DECLARE
    edad INTEGER;
BEGIN
    edad := EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nac));
    IF edad <= 13 THEN RETURN 'U13';
    ELSIF edad <= 15 THEN RETURN 'U15';
    ELSIF edad <= 17 THEN RETURN 'U17';
    ELSE RETURN 'U19';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para asignar categoría
CREATE OR REPLACE FUNCTION set_player_categoria()
RETURNS TRIGGER AS $$
BEGIN
    NEW.categoria := calculate_categoria(NEW.fecha_nacimiento);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_categoria
    BEFORE INSERT OR UPDATE OF fecha_nacimiento ON players
    FOR EACH ROW
    EXECUTE FUNCTION set_player_categoria();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funciones para calcular ratios
CREATE OR REPLACE FUNCTION calculate_ratio_sets(sets_favor INTEGER, sets_contra INTEGER)
RETURNS DECIMAL(10, 3) AS $$
BEGIN
    IF sets_contra = 0 THEN RETURN sets_favor::DECIMAL; END IF;
    RETURN ROUND((sets_favor::DECIMAL / sets_contra::DECIMAL), 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_ratio_puntos(puntos_favor INTEGER, puntos_contra INTEGER)
RETURNS DECIMAL(10, 3) AS $$
BEGIN
    IF puntos_contra = 0 THEN RETURN puntos_favor::DECIMAL; END IF;
    RETURN ROUND((puntos_favor::DECIMAL / puntos_contra::DECIMAL), 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función principal: actualizar standings después de un partido
CREATE OR REPLACE FUNCTION update_standings_after_match()
RETURNS TRIGGER AS $$
DECLARE
    v_team_a_sets INTEGER := 0;
    v_team_b_sets INTEGER := 0;
    v_team_a_points INTEGER := 0;
    v_team_b_points INTEGER := 0;
BEGIN
    IF NEW.status != 'finalizado' OR NEW.fase != 'grupos' THEN
        RETURN NEW;
    END IF;

    IF NEW.set1_score_a > NEW.set1_score_b THEN v_team_a_sets := v_team_a_sets + 1; 
    ELSE v_team_b_sets := v_team_b_sets + 1; END IF;
    
    IF NEW.set2_score_a > NEW.set2_score_b THEN v_team_a_sets := v_team_a_sets + 1; 
    ELSE v_team_b_sets := v_team_b_sets + 1; END IF;
    
    IF NEW.set3_score_a IS NOT NULL AND NEW.set3_score_b IS NOT NULL THEN
        IF NEW.set3_score_a > NEW.set3_score_b THEN v_team_a_sets := v_team_a_sets + 1; 
        ELSE v_team_b_sets := v_team_b_sets + 1; END IF;
    END IF;

    v_team_a_points := COALESCE(NEW.set1_score_a, 0) + COALESCE(NEW.set2_score_a, 0) + COALESCE(NEW.set3_score_a, 0);
    v_team_b_points := COALESCE(NEW.set1_score_b, 0) + COALESCE(NEW.set2_score_b, 0) + COALESCE(NEW.set3_score_b, 0);

    INSERT INTO standings (group_id, team_id, partidos_jugados, partidos_ganados, partidos_perdidos, sets_favor, sets_contra, puntos_favor, puntos_contra)
    VALUES (
        NEW.group_id, NEW.team_a_id, 1,
        CASE WHEN NEW.winner_id = NEW.team_a_id THEN 1 ELSE 0 END,
        CASE WHEN NEW.winner_id = NEW.team_b_id THEN 1 ELSE 0 END,
        v_team_a_sets, v_team_b_sets, v_team_a_points, v_team_b_points
    )
    ON CONFLICT (group_id, team_id) DO UPDATE SET
        partidos_jugados = standings.partidos_jugados + 1,
        partidos_ganados = standings.partidos_ganados + CASE WHEN NEW.winner_id = NEW.team_a_id THEN 1 ELSE 0 END,
        partidos_perdidos = standings.partidos_perdidos + CASE WHEN NEW.winner_id = NEW.team_b_id THEN 1 ELSE 0 END,
        sets_favor = standings.sets_favor + v_team_a_sets,
        sets_contra = standings.sets_contra + v_team_b_sets,
        puntos_favor = standings.puntos_favor + v_team_a_points,
        puntos_contra = standings.puntos_contra + v_team_b_points,
        ratio_sets = calculate_ratio_sets(standings.sets_favor + v_team_a_sets, standings.sets_contra + v_team_b_sets),
        ratio_puntos = calculate_ratio_puntos(standings.puntos_favor + v_team_a_points, standings.puntos_contra + v_team_b_points);

    INSERT INTO standings (group_id, team_id, partidos_jugados, partidos_ganados, partidos_perdidos, sets_favor, sets_contra, puntos_favor, puntos_contra)
    VALUES (
        NEW.group_id, NEW.team_b_id, 1,
        CASE WHEN NEW.winner_id = NEW.team_b_id THEN 1 ELSE 0 END,
        CASE WHEN NEW.winner_id = NEW.team_a_id THEN 1 ELSE 0 END,
        v_team_b_sets, v_team_a_sets, v_team_b_points, v_team_a_points
    )
    ON CONFLICT (group_id, team_id) DO UPDATE SET
        partidos_jugados = standings.partidos_jugados + 1,
        partidos_ganados = standings.partidos_ganados + CASE WHEN NEW.winner_id = NEW.team_b_id THEN 1 ELSE 0 END,
        partidos_perdidos = standings.partidos_perdidos + CASE WHEN NEW.winner_id = NEW.team_a_id THEN 1 ELSE 0 END,
        sets_favor = standings.sets_favor + v_team_b_sets,
        sets_contra = standings.sets_contra + v_team_a_sets,
        puntos_favor = standings.puntos_favor + v_team_b_points,
        puntos_contra = standings.puntos_contra + v_team_a_points,
        ratio_sets = calculate_ratio_sets(standings.sets_favor + v_team_b_sets, standings.sets_contra + v_team_a_sets),
        ratio_puntos = calculate_ratio_puntos(standings.puntos_favor + v_team_b_points, standings.puntos_contra + v_team_a_points);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_standings
    AFTER INSERT OR UPDATE ON matches
    FOR EACH ROW
    WHEN (NEW.status = 'finalizado' AND NEW.fase = 'grupos')
    EXECUTE FUNCTION update_standings_after_match();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- Políticas de LECTURA PÚBLICA
CREATE POLICY "allow_public_read_players" ON players FOR SELECT USING (true);
CREATE POLICY "allow_public_read_tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "allow_public_read_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "allow_public_read_groups" ON groups FOR SELECT USING (true);
CREATE POLICY "allow_public_read_team_groups" ON team_groups FOR SELECT USING (true);
CREATE POLICY "allow_public_read_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "allow_public_read_standings" ON standings FOR SELECT USING (true);
CREATE POLICY "allow_public_read_ranking_history" ON ranking_history FOR SELECT USING (true);

-- Políticas de ESCRITURA para usuarios autenticados
-- INSERT
CREATE POLICY "allow_auth_insert_players" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_tournaments" ON tournaments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_teams" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_groups" ON groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_team_groups" ON team_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_matches" ON matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_standings" ON standings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_insert_ranking_history" ON ranking_history FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE
CREATE POLICY "allow_auth_update_players" ON players FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_tournaments" ON tournaments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_teams" ON teams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_groups" ON groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_team_groups" ON team_groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_matches" ON matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_standings" ON standings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_update_ranking_history" ON ranking_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DELETE
CREATE POLICY "allow_auth_delete_players" ON players FOR DELETE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete_tournaments" ON tournaments FOR DELETE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete_teams" ON teams FOR DELETE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete_groups" ON groups FOR DELETE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete_team_groups" ON team_groups FOR DELETE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete_matches" ON matches FOR DELETE TO authenticated USING (true);
CREATE POLICY "allow_auth_delete_standings" ON standings FOR DELETE TO authenticated USING (true);

-- ================================================
-- DATOS DE EJEMPLO
-- ================================================

INSERT INTO players (nombre, apellido, dni, fecha_nacimiento, genero, categoria) VALUES
('Juan', 'Pérez', '12345678', '2010-05-15', 'M', 'U15'),
('María', 'González', '23456789', '2010-08-20', 'F', 'U15'),
('Carlos', 'Rodríguez', '34567890', '2009-03-10', 'M', 'U17'),
('Ana', 'Martínez', '45678901', '2009-11-25', 'F', 'U17');
