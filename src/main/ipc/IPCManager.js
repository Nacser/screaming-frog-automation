const ConfigHandlers   = require('./handlers/ConfigHandlers');
const CrawlHandlers    = require('./handlers/CrawlHandlers');
const FileHandlers     = require('./handlers/FileHandlers');
const ScheduleHandlers = require('./handlers/ScheduleHandlers');
const Logger           = require('../utils/Logger');

class IPCManager {
  static registerAll() {
    ConfigHandlers.register();
    CrawlHandlers.register();
    FileHandlers.register();
    ScheduleHandlers.register();
    Logger.info('Todos los handlers IPC registrados');
  }
}

module.exports = IPCManager;