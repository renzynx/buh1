ALTER TABLE `files` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `files_slug_unique` ON `files` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_files_slug` ON `files` (`slug`);--> statement-breakpoint
UPDATE `files` SET `slug` = substr(hex(randomblob(3)), 1, 6) WHERE `slug` IS NULL;
