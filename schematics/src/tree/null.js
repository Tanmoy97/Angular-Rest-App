"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const exception_1 = require("../exception/exception");
const recorder_1 = require("./recorder");
class CannotCreateFileException extends exception_1.BaseException {
    constructor(path) { super(`Cannot create file "${path}".`); }
}
exports.CannotCreateFileException = CannotCreateFileException;
class NullTree {
    // Simple readonly file system operations.
    exists(_path) { return false; }
    read(_path) { return null; }
    get(_path) { return null; }
    get files() { return []; }
    // Change content of host files.
    beginUpdate(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    commitUpdate(record) {
        throw new exception_1.FileDoesNotExistException(record instanceof recorder_1.UpdateRecorderBase
            ? record.path
            : '<unknown>');
    }
    // Change structure of the host.
    copy(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    delete(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    create(path, _content) {
        throw new CannotCreateFileException(path);
    }
    rename(path, _to) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    overwrite(path, _content) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    apply(_action, _strategy) { }
    get actions() {
        return [];
    }
}
exports.NullTree = NullTree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvaGFuc2wvU291cmNlcy9kZXZraXQvIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy90cmVlL251bGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxzREFBa0Y7QUFHbEYseUNBQWdEO0FBR2hELCtCQUF1QyxTQUFRLHlCQUFhO0lBQzFELFlBQVksSUFBWSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEU7QUFGRCw4REFFQztBQUdEO0lBQ0UsMENBQTBDO0lBQzFDLE1BQU0sQ0FBQyxLQUFhLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDdkMsSUFBSSxDQUFDLEtBQWEsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNwQyxHQUFHLENBQUMsS0FBYSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ25DLElBQUksS0FBSyxLQUFlLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXBDLGdDQUFnQztJQUNoQyxXQUFXLENBQUMsSUFBWTtRQUN0QixNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELFlBQVksQ0FBQyxNQUFzQjtRQUNqQyxNQUFNLElBQUkscUNBQXlCLENBQUMsTUFBTSxZQUFZLDZCQUFrQjtjQUNwRSxNQUFNLENBQUMsSUFBSTtjQUNYLFdBQVcsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxnQ0FBZ0M7SUFDaEMsSUFBSSxDQUFDLElBQVksRUFBRSxHQUFXO1FBQzVCLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVk7UUFDakIsTUFBTSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBWSxFQUFFLFFBQXlCO1FBQzVDLE1BQU0sSUFBSSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVksRUFBRSxHQUFXO1FBQzlCLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsU0FBUyxDQUFDLElBQVksRUFBRSxRQUF5QjtRQUMvQyxNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFlLEVBQUUsU0FBeUIsSUFBUyxDQUFDO0lBQzFELElBQUksT0FBTztRQUNULE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDWixDQUFDO0NBQ0Y7QUF0Q0QsNEJBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiwgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgQWN0aW9uIH0gZnJvbSAnLi9hY3Rpb24nO1xuaW1wb3J0IHsgTWVyZ2VTdHJhdGVneSwgVHJlZSwgVXBkYXRlUmVjb3JkZXIgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBVcGRhdGVSZWNvcmRlckJhc2UgfSBmcm9tICcuL3JlY29yZGVyJztcblxuXG5leHBvcnQgY2xhc3MgQ2Fubm90Q3JlYXRlRmlsZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHsgc3VwZXIoYENhbm5vdCBjcmVhdGUgZmlsZSBcIiR7cGF0aH1cIi5gKTsgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBOdWxsVHJlZSBpbXBsZW1lbnRzIFRyZWUge1xuICAvLyBTaW1wbGUgcmVhZG9ubHkgZmlsZSBzeXN0ZW0gb3BlcmF0aW9ucy5cbiAgZXhpc3RzKF9wYXRoOiBzdHJpbmcpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIHJlYWQoX3BhdGg6IHN0cmluZykgeyByZXR1cm4gbnVsbDsgfVxuICBnZXQoX3BhdGg6IHN0cmluZykgeyByZXR1cm4gbnVsbDsgfVxuICBnZXQgZmlsZXMoKTogc3RyaW5nW10geyByZXR1cm4gW107IH1cblxuICAvLyBDaGFuZ2UgY29udGVudCBvZiBob3N0IGZpbGVzLlxuICBiZWdpblVwZGF0ZShwYXRoOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgY29tbWl0VXBkYXRlKHJlY29yZDogVXBkYXRlUmVjb3JkZXIpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocmVjb3JkIGluc3RhbmNlb2YgVXBkYXRlUmVjb3JkZXJCYXNlXG4gICAgICA/IHJlY29yZC5wYXRoXG4gICAgICA6ICc8dW5rbm93bj4nKTtcbiAgfVxuXG4gIC8vIENoYW5nZSBzdHJ1Y3R1cmUgb2YgdGhlIGhvc3QuXG4gIGNvcHkocGF0aDogc3RyaW5nLCBfdG86IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICBkZWxldGUocGF0aDogc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBGaWxlRG9lc05vdEV4aXN0RXhjZXB0aW9uKHBhdGgpO1xuICB9XG4gIGNyZWF0ZShwYXRoOiBzdHJpbmcsIF9jb250ZW50OiBCdWZmZXIgfCBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IENhbm5vdENyZWF0ZUZpbGVFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgcmVuYW1lKHBhdGg6IHN0cmluZywgX3RvOiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cbiAgb3ZlcndyaXRlKHBhdGg6IHN0cmluZywgX2NvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuXG4gIGFwcGx5KF9hY3Rpb246IEFjdGlvbiwgX3N0cmF0ZWd5PzogTWVyZ2VTdHJhdGVneSk6IHZvaWQge31cbiAgZ2V0IGFjdGlvbnMoKTogQWN0aW9uW10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuIl19