ALTER TABLE `files` ADD `slug` text;--> statement-breakpoint
UPDATE `files` SET `slug` = substr(hex(randomblob(2)), 1, 4) WHERE `slug` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `files_slug_unique` ON `files` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_files_slug` ON `files` (`slug`);
