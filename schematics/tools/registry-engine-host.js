"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
const file_system_utility_1 = require("./file-system-utility");
/**
 * A simple EngineHost that uses a registry of {name => path} to find collections. This can be
 * useful for tooling that want to load generic collections from random places.
 */
class RegistryEngineHost extends file_system_engine_host_base_1.FileSystemEngineHostBase {
    constructor() {
        super(...arguments);
        this._registry = new Map();
    }
    registerPath(path) {
        // Read the collection from the path.
        if (fs_1.existsSync(path) && fs_1.statSync(path).isFile()) {
            // Allow path to be fully qualified to a JSON file.
        }
        else if (fs_1.existsSync(path_1.join(path, 'collection.json')) && fs_1.statSync(path).isFile()) {
            // Allow path to point to a directory containing a `collection.json`.
            path = path_1.join(path, 'collection.json');
        }
        else {
            throw new Error(`Invalid path: "${path}".`);
        }
        const json = file_system_utility_1.readJsonFile(path);
        if (!json) {
            throw new Error(`Invalid path for collection: "${path}".`);
        }
        // Validate that the name is not in the registry already (and that the registry does not
        // contain this path under another name.
        const name = json.name;
        const maybePath = this._registry.get(name);
        if (maybePath && maybePath != path) {
            throw new Error(`Collection name "${name}" already registered.`);
        }
        for (const registryPath of this._registry.values()) {
            if (registryPath == path) {
                throw new Error(`Collection path "${path}" already registered under another name.`);
            }
        }
        this._registry.set(name, path);
    }
    removePath(path) {
        for (const [key, p] of this._registry.entries()) {
            if (p == path) {
                this._registry.delete(key);
            }
        }
    }
    removeName(name) {
        this._registry.delete(name);
    }
    _resolveCollectionPath(name) {
        const maybePath = this._registry.get(name);
        return maybePath || null;
    }
    _resolveReferenceString(refString, parentPath) {
        // Use the same kind of export strings as NodeModule.
        const ref = new export_ref_1.ExportStringRef(refString, parentPath);
        if (!ref.ref) {
            return null;
        }
        return { ref: ref.ref, path: ref.module };
    }
    _transformCollectionDescription(_name, desc) {
        if (!desc.name || !desc.path || !desc.schematics || !desc.version) {
            return null;
        }
        if (typeof desc.schematics != 'object') {
            return null;
        }
        return desc;
    }
    _transformSchematicDescription(_name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            return null;
        }
        return desc;
    }
}
exports.RegistryEngineHost = RegistryEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cnktZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2hhbnNsL1NvdXJjZXMvZGV2a2l0LyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy90b29scy9yZWdpc3RyeS1lbmdpbmUtaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVlBLDJCQUEwQztBQUMxQywrQkFBNEI7QUFFNUIsNkNBQStDO0FBQy9DLGlGQUEwRTtBQUMxRSwrREFBcUQ7QUFZckQ7OztHQUdHO0FBQ0gsd0JBQWdDLFNBQVEsdURBQXdCO0lBQWhFOztRQUNZLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztJQXFGbEQsQ0FBQztJQW5GQyxZQUFZLENBQUMsSUFBWTtRQUN2QixxQ0FBcUM7UUFFckMsRUFBRSxDQUFDLENBQUMsZUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEQsbURBQW1EO1FBQ3JELENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsZUFBVSxDQUFDLFdBQUksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLGFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEYscUVBQXFFO1lBQ3JFLElBQUksR0FBRyxXQUFJLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQTZCLGtDQUFZLENBQUMsSUFBSSxDQUE2QixDQUFDO1FBQ3RGLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNWLE1BQU0s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QUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBK0IsQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUF0RkQsZ0RBc0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvbkRlc2NyaXB0aW9uLFxuICBSdWxlRmFjdG9yeSxcbiAgU2NoZW1hdGljRGVzY3JpcHRpb24sXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjcmlwdGlvbiwgRmlsZVN5c3RlbVNjaGVtYXRpY0Rlc2NyaXB0aW9uIH0gZnJvbSAnLi9kZXNjcmlwdGlvbic7XG5pbXBvcnQgeyBFeHBvcnRTdHJpbmdSZWYgfSBmcm9tICcuL2V4cG9ydC1yZWYnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbUVuZ2luZUhvc3RCYXNlIH0gZnJvbSAnLi9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNpbXBsaWZ5IHR5cGluZ3MuXG4gKi9cbmV4cG9ydCBkZWNsYXJlIHR5cGUgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjXG4gID0gQ29sbGVjdGlvbkRlc2NyaXB0aW9uPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24+O1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBGaWxlU3lzdGVtU2NoZW1hdGljRGVzY1xuICA9IFNjaGVtYXRpY0Rlc2NyaXB0aW9uPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbj47XG5cblxuLyoqXG4gKiBBIHNpbXBsZSBFbmdpbmVIb3N0IHRoYXQgdXNlcyBhIHJlZ2lzdHJ5IG9mIHtuYW1lID0+IHBhdGh9IHRvIGZpbmQgY29sbGVjdGlvbnMuIFRoaXMgY2FuIGJlXG4gKiB1c2VmdWwgZm9yIHRvb2xpbmcgdGhhdCB3YW50IHRvIGxvYWQgZ2VuZXJpYyBjb2xsZWN0aW9ucyBmcm9tIHJhbmRvbSBwbGFjZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWdpc3RyeUVuZ2luZUhvc3QgZXh0ZW5kcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2Uge1xuICBwcm90ZWN0ZWQgX3JlZ2lzdHJ5ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICByZWdpc3RlclBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgLy8gUmVhZCB0aGUgY29sbGVjdGlvbiBmcm9tIHRoZSBwYXRoLlxuXG4gICAgaWYgKGV4aXN0c1N5bmMocGF0aCkgJiYgc3RhdFN5bmMocGF0aCkuaXNGaWxlKCkpIHtcbiAgICAgIC8vIEFsbG93IHBhdGggdG8gYmUgZnVsbHkgcXVhbGlmaWVkIHRvIGEgSlNPTiBmaWxlLlxuICAgIH0gZWxzZSBpZiAoZXhpc3RzU3luYyhqb2luKHBhdGgsICdjb2xsZWN0aW9uLmpzb24nKSkgJiYgc3RhdFN5bmMocGF0aCkuaXNGaWxlKCkpIHtcbiAgICAgIC8vIEFsbG93IHBhdGggdG8gcG9pbnQgdG8gYSBkaXJlY3RvcnkgY29udGFpbmluZyBhIGBjb2xsZWN0aW9uLmpzb25gLlxuICAgICAgcGF0aCA9IGpvaW4ocGF0aCwgJ2NvbGxlY3Rpb24uanNvbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcGF0aDogXCIke3BhdGh9XCIuYCk7XG4gICAgfVxuXG4gICAgY29uc3QganNvbjogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjID0gcmVhZEpzb25GaWxlKHBhdGgpIGFzIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgICBpZiAoIWpzb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBwYXRoIGZvciBjb2xsZWN0aW9uOiBcIiR7cGF0aH1cIi5gKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSB0aGF0IHRoZSBuYW1lIGlzIG5vdCBpbiB0aGUgcmVnaXN0cnkgYWxyZWFkeSAoYW5kIHRoYXQgdGhlIHJlZ2lzdHJ5IGRvZXMgbm90XG4gICAgLy8gY29udGFpbiB0aGlzIHBhdGggdW5kZXIgYW5vdGhlciBuYW1lLlxuICAgIGNvbnN0IG5hbWUgPSBqc29uLm5hbWU7XG4gICAgY29uc3QgbWF5YmVQYXRoID0gdGhpcy5fcmVnaXN0cnkuZ2V0KG5hbWUpO1xuICAgIGlmIChtYXliZVBhdGggJiYgbWF5YmVQYXRoICE9IHBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ29sbGVjdGlvbiBuYW1lIFwiJHtuYW1lfVwiIGFscmVhZHkgcmVnaXN0ZXJlZC5gKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCByZWdpc3RyeVBhdGggb2YgdGhpcy5fcmVnaXN0cnkudmFsdWVzKCkpIHtcbiAgICAgIGlmIChyZWdpc3RyeVBhdGggPT0gcGF0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbGxlY3Rpb24gcGF0aCBcIiR7cGF0aH1cIiBhbHJlYWR5IHJlZ2lzdGVyZWQgdW5kZXIgYW5vdGhlciBuYW1lLmApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3JlZ2lzdHJ5LnNldChuYW1lLCBwYXRoKTtcbiAgfVxuXG4gIHJlbW92ZVBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgZm9yIChjb25zdCBba2V5LCBwXSBvZiB0aGlzLl9yZWdpc3RyeS5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChwID09IHBhdGgpIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnkuZGVsZXRlKGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlTmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9yZWdpc3RyeS5kZWxldGUobmFtZSk7XG4gIH1cblxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IG1heWJlUGF0aCA9IHRoaXMuX3JlZ2lzdHJ5LmdldChuYW1lKTtcblxuICAgIHJldHVybiBtYXliZVBhdGggfHwgbnVsbDtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhyZWZTdHJpbmc6IHN0cmluZywgcGFyZW50UGF0aDogc3RyaW5nKSB7XG4gICAgLy8gVXNlIHRoZSBzYW1lIGtpbmQgb2YgZXhwb3J0IHN0cmluZ3MgYXMgTm9kZU1vZHVsZS5cbiAgICBjb25zdCByZWYgPSBuZXcgRXhwb3J0U3RyaW5nUmVmPFJ1bGVGYWN0b3J5PHt9Pj4ocmVmU3RyaW5nLCBwYXJlbnRQYXRoKTtcbiAgICBpZiAoIXJlZi5yZWYpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7IHJlZjogcmVmLnJlZiwgcGF0aDogcmVmLm1vZHVsZSB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oX25hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2M+KSB7XG4gICAgaWYgKCFkZXNjLm5hbWUgfHwgIWRlc2MucGF0aCB8fCAhZGVzYy5zY2hlbWF0aWNzIHx8ICFkZXNjLnZlcnNpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlc2Muc2NoZW1hdGljcyAhPSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2MgYXMgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjO1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1TY2hlbWF0aWNEZXNjcmlwdGlvbihfbmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4pIHtcbiAgICBpZiAoIWRlc2MuZmFjdG9yeUZuIHx8ICFkZXNjLnBhdGggfHwgIWRlc2MuZGVzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBkZXNjIGFzIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuICB9XG59XG4iXX0=