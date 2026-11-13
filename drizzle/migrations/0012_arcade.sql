CREATE TABLE public.arcade_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text NOT NULL CHECK (url ~* '^https://'),
  emoji text NOT NULL DEFAULT '🕹️',
  category text NOT NULL DEFAULT 'Logic',
  difficulty text NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  platform text NOT NULL DEFAULT '',
  is_free boolean NOT NULL DEFAULT true,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.arcade_games TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arcade_games TO authenticated;
GRANT ALL ON public.arcade_games TO service_role;
ALTER TABLE public.arcade_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arcade public read" ON public.arcade_games FOR SELECT USING (NOT hidden OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "arcade admin insert" ON public.arcade_games FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "arcade admin update" ON public.arcade_games FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "arcade admin delete" ON public.arcade_games FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_game_plays (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  game_id uuid NOT NULL REFERENCES public.arcade_games(id) ON DELETE CASCADE,
  played_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_game_plays TO authenticated;
GRANT ALL ON public.user_game_plays TO service_role;
ALTER TABLE public.user_game_plays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plays own read" ON public.user_game_plays FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "plays own insert" ON public.user_game_plays FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plays own delete" ON public.user_game_plays FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.arcade_games (title, description, url, emoji, category, difficulty, platform, is_free, sort_order) VALUES
('Flexbox Froggy','Help the frogs reach their lily pads by writing CSS flexbox rules.','https://flexboxfroggy.com/','🐸','CSS & HTML','Beginner','Codepip',true,1),
('Grid Garden','Water your carrot garden with CSS grid.','https://cssgridgarden.com/','🥕','CSS & HTML','Beginner','Codepip',true,2),
('CSSBattle','Recreate target images with the shortest CSS you can.','https://cssbattle.dev/','🎯','CSS & HTML','Intermediate','CSSBattle',true,3),
('Learn Git Branching','Visual, interactive puzzles for mastering git branches.','https://learngitbranching.js.org/','🌿','Git & CLI','Beginner','Peter Cottle',true,4),
('Oh My Git!','An open-source game that visualizes the inner workings of git.','https://ohmygit.org/','🧙','Git & CLI','Beginner','Oh My Git!',true,5),
('Bandit','Learn Linux shell basics by hacking through levels over SSH.','https://overthewire.org/wargames/bandit/','🏴‍☠️','Git & CLI','Beginner','OverTheWire',true,6),
('cmdchallenge','Solve tasks with a single bash command in the browser.','https://cmdchallenge.com/','💻','Git & CLI','Intermediate','cmdchallenge',true,7),
('Vim Adventures','Learn Vim keyboard shortcuts through a Zelda-style adventure.','https://vim-adventures.com/','⌨️','Git & CLI','Beginner','Vim Adventures',false,8),
('SQL Murder Mystery','Solve a murder in SQL City by querying the police database.','https://mystery.knightlab.com/','🕵️','SQL & DB','Beginner','Knight Lab',true,9),
('SQL Police Department','Crack cases by writing SQL queries.','https://sqlpd.com/','🚓','SQL & DB','Beginner','SQLPD',false,10),
('CodinGame','Write code to play games and puzzles in 25+ languages.','https://www.codingame.com/start/','👾','Coding & Algorithms','Intermediate','CodinGame',true,11),
('CodeCombat','Learn Python and JavaScript by playing a fantasy RPG.','https://codecombat.com/','⚔️','Coding & Algorithms','Beginner','CodeCombat',true,12),
('Elevator Saga','Program elevators in JavaScript to move people efficiently.','https://play.elevatorsaga.com/','🛗','JavaScript','Intermediate','Elevator Saga',true,13),
('Regex Crossword','Crossword puzzles solved with regular expressions.','https://regexcrossword.com/','🔣','Coding & Algorithms','Intermediate','Regex Crossword',true,14),
('K8s Games','Learn Kubernetes concepts by playing hands-on games.','https://k8sgames.com/','☸️','Cloud & DevOps','Intermediate','K8s Games',true,15),
('AWS Cloud Quest','Role-playing game where you build cloud solutions on AWS.','https://aws.amazon.com/training/digital/aws-cloud-quest','☁️','Cloud & DevOps','Beginner','AWS',true,16);