-- Add role_id column to user table
ALTER TABLE `user` ADD COLUMN role_id INT NOT NULL DEFAULT 2;
ALTER TABLE `user` ADD CONSTRAINT fk_user_role_id_roles FOREIGN KEY (role_id) REFERENCES roles (id);
