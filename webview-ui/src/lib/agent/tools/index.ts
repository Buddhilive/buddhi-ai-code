import { viewFile } from './view_file';
import { writeToFile } from './write_to_file';
import { replaceFileContent } from './replace_file_content';
import { multiReplaceFileContent } from './multi_replace_file_content';
import { listDir } from './list_dir';
import { findByName } from './find_by_name';
import { grepSearch } from './grep_search';
import { readUrlContent } from './read_url_content';
import { runCommand } from './run_command';
import { manageTask } from './manage_task';
import { schedule } from './schedule';
import { listPermissions } from './list_permissions';
import { askPermission } from './ask_permission';

export const allTools = [
  viewFile,
  writeToFile,
  replaceFileContent,
  multiReplaceFileContent,
  listDir,
  findByName,
  grepSearch,
  readUrlContent,
  runCommand,
  manageTask,
  schedule,
  listPermissions,
  askPermission
];
