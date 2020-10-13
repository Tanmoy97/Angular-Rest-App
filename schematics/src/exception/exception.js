"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
class BaseException extends Error {
    constructor(message = '') {
        super(message);
    }
}
exports.BaseException = BaseException;
// Used by schematics to throw exceptions.
class SchematicsError extends BaseException {
}
exports.SchematicsError = SchematicsError;
// Exceptions
class FileDoesNotExistException extends BaseException {
    constructor(path) { super(`Path "${path}" does not exist.`); }
}
exports.FileDoesNotExistException = FileDoesNotExistException;
class FileAlreadyExistException extends BaseException {
    constructor(path) { super(`Path "${path}" already exist.`); }
}
exports.FileAlreadyExistException = FileAlreadyExistException;
class ContentHasMutatedException extends BaseException {
    constructor(path) {
        super(`Content at path "${path}" has changed between the start and the end of an update.`);
    }
}
exports.ContentHasMutatedException = ContentHasMutatedException;
class InvalidUpdateRecordException extends BaseException {
    constructor() { super(`Invalid record instance.`); }
}
exports.InvalidUpdateRecordException = InvalidUpdateRecordException;
class MergeConflictException extends BaseException {
    constructor(path) {
        super(`A merge conflicted on path "${path}".`);
    }
}
exports.MergeConflictException = MergeConflictException;
class UnimplementedException extends BaseException {
    constructor() { super('This function is unimplemented.'); }
}
exports.UnimplementedException = UnimplementedException;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZXB0aW9uLmpzIiwic291cmNlUm9vdCI6Ii9Vc2Vycy9oYW5zbC9Tb3VyY2VzL2RldmtpdC8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL2V4Y2VwdGlvbi9leGNlcHRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxtQkFBMkIsU0FBUSxLQUFLO0lBQ3RDLFlBQVksT0FBTyxHQUFHLEVBQUU7UUFDdEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pCLENBQUM7Q0FDRjtBQUpELHNDQUlDO0FBR0QsMENBQTBDO0FBQzFDLHFCQUE2QixTQUFRLGFBQWE7Q0FBRztBQUFyRCwwQ0FBcUQ7QUFHckQsYUFBYTtBQUNiLCtCQUF1QyxTQUFRLGFBQWE7SUFDMUQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN2RTtBQUZELDhEQUVDO0FBQ0QsK0JBQXVDLFNBQVEsYUFBYTtJQUMxRCxZQUFZLElBQVksSUFBSSxLQUFLLENBQUMsU0FBUyxJQUFJLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3RFO0FBRkQsOERBRUM7QUFDRCxnQ0FBd0MsU0FBUSxhQUFhO0lBQzNELFlBQVksSUFBWTtRQUN0QixLQUFLLENBQUMsb0JBQW9CLElBQUksMkRBQTJELENBQUMsQ0FBQztJQUM3RixDQUFDO0NBQ0Y7QUFKRCxnRUFJQztBQUNELGtDQUEwQyxTQUFRLGFBQWE7SUFDN0QsZ0JBQWdCLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNyRDtBQUZELG9FQUVDO0FBQ0QsNEJBQW9DLFNBQVEsYUFBYTtJQUN2RCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLCtCQUErQixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRjtBQUpELHdEQUlDO0FBRUQsNEJBQW9DLFNBQVEsYUFBYTtJQUN2RCxnQkFBZ0IsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVEO0FBRkQsd0RBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCBjbGFzcyBCYXNlRXhjZXB0aW9uIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlID0gJycpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgfVxufVxuXG5cbi8vIFVzZWQgYnkgc2NoZW1hdGljcyB0byB0aHJvdyBleGNlcHRpb25zLlxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY3NFcnJvciBleHRlbmRzIEJhc2VFeGNlcHRpb24ge31cblxuXG4vLyBFeGNlcHRpb25zXG5leHBvcnQgY2xhc3MgRmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHsgc3VwZXIoYFBhdGggXCIke3BhdGh9XCIgZG9lcyBub3QgZXhpc3QuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBGaWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykgeyBzdXBlcihgUGF0aCBcIiR7cGF0aH1cIiBhbHJlYWR5IGV4aXN0LmApOyB9XG59XG5leHBvcnQgY2xhc3MgQ29udGVudEhhc011dGF0ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENvbnRlbnQgYXQgcGF0aCBcIiR7cGF0aH1cIiBoYXMgY2hhbmdlZCBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgdGhlIGVuZCBvZiBhbiB1cGRhdGUuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBJbnZhbGlkVXBkYXRlUmVjb3JkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcihgSW52YWxpZCByZWNvcmQgaW5zdGFuY2UuYCk7IH1cbn1cbmV4cG9ydCBjbGFzcyBNZXJnZUNvbmZsaWN0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgIHN1cGVyKGBBIG1lcmdlIGNvbmZsaWN0ZWQgb24gcGF0aCBcIiR7cGF0aH1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5pbXBsZW1lbnRlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoJ1RoaXMgZnVuY3Rpb24gaXMgdW5pbXBsZW1lbnRlZC4nKTsgfVxufVxuIl19