"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const Observable_1 = require("rxjs/Observable");
require("rxjs/add/observable/defer");
require("rxjs/add/observable/from");
require("rxjs/add/operator/concat");
require("rxjs/add/operator/concatMap");
require("rxjs/add/operator/ignoreElements");
require("rxjs/add/operator/last");
require("rxjs/add/operator/map");
require("rxjs/add/operator/mergeMap");
const exception_1 = require("../exception/exception");
const action_1 = require("../tree/action");
const Noop = function () { };
class SimpleSinkBase {
    constructor() {
        this.preCommitAction = Noop;
        this.postCommitAction = Noop;
        this.preCommit = Noop;
        this.postCommit = Noop;
    }
    _fileAlreadyExistException(path) {
        throw new exception_1.FileAlreadyExistException(path);
    }
    _fileDoesNotExistException(path) {
        throw new exception_1.FileDoesNotExistException(path);
    }
    _validateOverwriteAction(action) {
        return this._validateFileExists(action.path)
            .map(b => { if (!b) {
            this._fileDoesNotExistException(action.path);
        } });
    }
    _validateCreateAction(action) {
        return this._validateFileExists(action.path)
            .map(b => { if (b) {
            this._fileAlreadyExistException(action.path);
        } });
    }
    _validateRenameAction(action) {
        return this._validateFileExists(action.path)
            .map(b => { if (!b) {
            this._fileDoesNotExistException(action.path);
        } })
            .mergeMap(() => this._validateFileExists(action.to))
            .map(b => { if (b) {
            this._fileAlreadyExistException(action.to);
        } });
    }
    _validateDeleteAction(action) {
        return this._validateFileExists(action.path)
            .map(b => { if (!b) {
            this._fileDoesNotExistException(action.path);
        } });
    }
    validateSingleAction(action) {
        switch (action.kind) {
            case 'o': return this._validateOverwriteAction(action);
            case 'c': return this._validateCreateAction(action);
            case 'r': return this._validateRenameAction(action);
            case 'd': return this._validateDeleteAction(action);
            default: throw new action_1.UnknownActionException(action);
        }
    }
    commitSingleAction(action) {
        return Observable_1.Observable.empty()
            .concat(new Observable_1.Observable(observer => {
            return this.validateSingleAction(action).subscribe(observer);
        }))
            .concat(new Observable_1.Observable(observer => {
            let committed = null;
            switch (action.kind) {
                case 'o':
                    committed = this._overwriteFile(action.path, action.content);
                    break;
                case 'c':
                    committed = this._createFile(action.path, action.content);
                    break;
                case 'r':
                    committed = this._renameFile(action.path, action.to);
                    break;
                case 'd':
                    committed = this._deleteFile(action.path);
                    break;
            }
            if (committed) {
                committed.subscribe(observer);
            }
            else {
                observer.complete();
            }
        }));
    }
    commit(tree) {
        const actions = Observable_1.Observable.from(tree.actions);
        return (this.preCommit() || Observable_1.Observable.empty())
            .concat(Observable_1.Observable.defer(() => actions))
            .concatMap((action) => {
            const maybeAction = this.preCommitAction(action);
            if (!maybeAction) {
                return Observable_1.Observable.of(action);
            }
            else if (action_1.isAction(maybeAction)) {
                return Observable_1.Observable.of(maybeAction);
            }
            else {
                return maybeAction;
            }
        })
            .mergeMap((action) => {
            return this.commitSingleAction(action).ignoreElements().concat([action]);
        })
            .mergeMap((action) => this.postCommitAction(action) || Observable_1.Observable.empty())
            .concat(Observable_1.Observable.defer(() => this._done()))
            .concat(Observable_1.Observable.defer(() => this.postCommit() || Observable_1.Observable.empty()));
    }
}
exports.SimpleSinkBase = SimpleSinkBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luay5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvaGFuc2wvU291cmNlcy9kZXZraXQvIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9zaW5rL3NpbmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxnREFBNkM7QUFDN0MscUNBQW1DO0FBQ25DLG9DQUFrQztBQUNsQyxvQ0FBa0M7QUFDbEMsdUNBQXFDO0FBQ3JDLDRDQUEwQztBQUMxQyxrQ0FBZ0M7QUFDaEMsaUNBQStCO0FBQy9CLHNDQUFvQztBQUNwQyxzREFBOEY7QUFDOUYsMkNBUXdCO0FBYXhCLE1BQU0sSUFBSSxHQUFHLGNBQVksQ0FBQyxDQUFDO0FBRzNCO0lBQUE7UUFDRSxvQkFBZSxHQUcyQyxJQUFJLENBQUM7UUFDL0QscUJBQWdCLEdBQWdELElBQUksQ0FBQztRQUNyRSxjQUFTLEdBQWtDLElBQUksQ0FBQztRQUNoRCxlQUFVLEdBQWtDLElBQUksQ0FBQztJQTJGbkQsQ0FBQztJQWhGVywwQkFBMEIsQ0FBQyxJQUFZO1FBQy9DLE1BQU0sSUFBSSxxQ0FBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ1MsMEJBQTBCLENBQUMsSUFBWTtRQUMvQyxNQUFNLElBQUkscUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLHdCQUF3QixDQUFDLE1BQTJCO1FBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQzthQUN6QyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUNTLHFCQUFxQixDQUFD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Q0FBQyxpQkFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLHVCQUFVLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ3JCLENBQUM7UUFDSCxDQUFDLENBQUM7YUFDRCxRQUFRLENBQUMsQ0FBQyxNQUFjO1lBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMzRSxDQUFDLENBQUM7YUFDRCxRQUFRLENBQUMsQ0FBQyxNQUFjLEtBQUssSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLHVCQUFVLENBQUMsS0FBSyxFQUFRLENBQUM7YUFDdkYsTUFBTSxDQUFDLHVCQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7YUFDNUMsTUFBTSxDQUFDLHVCQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLHVCQUFVLENBQUMsS0FBSyxFQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ25GLENBQUM7Q0FDRjtBQWxHRCx3Q0FrR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcy9PYnNlcnZhYmxlJztcbmltcG9ydCAncnhqcy9hZGQvb2JzZXJ2YWJsZS9kZWZlcic7XG5pbXBvcnQgJ3J4anMvYWRkL29ic2VydmFibGUvZnJvbSc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL2NvbmNhdCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL2NvbmNhdE1hcCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL2lnbm9yZUVsZW1lbnRzJztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3IvbGFzdCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL21hcCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL21lcmdlTWFwJztcbmltcG9ydCB7IEZpbGVBbHJlYWR5RXhpc3RFeGNlcHRpb24sIEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7XG4gIEFjdGlvbixcbiAgQ3JlYXRlRmlsZUFjdGlvbixcbiAgRGVsZXRlRmlsZUFjdGlvbixcbiAgT3ZlcndyaXRlRmlsZUFjdGlvbixcbiAgUmVuYW1lRmlsZUFjdGlvbixcbiAgVW5rbm93bkFjdGlvbkV4Y2VwdGlvbixcbiAgaXNBY3Rpb24sXG59IGZyb20gJy4uL3RyZWUvYWN0aW9uJztcbmltcG9ydCB7IFRyZWUgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBTaW5rIHtcbiAgcHJlQ29tbWl0QWN0aW9uOiAoYWN0aW9uOiBBY3Rpb24pID0+IHZvaWQgfCBQcm9taXNlTGlrZTxBY3Rpb24+IHwgT2JzZXJ2YWJsZTxBY3Rpb24+IHwgQWN0aW9uO1xuICBwcmVDb21taXQ6ICgpID0+IHZvaWQgfCBPYnNlcnZhYmxlPHZvaWQ+O1xuICBwb3N0Q29tbWl0OiAoKSA9PiB2b2lkIHwgT2JzZXJ2YWJsZTx2b2lkPjtcblxuICBjb21taXQodHJlZTogVHJlZSk6IE9ic2VydmFibGU8dm9pZD47XG59XG5cblxuY29uc3QgTm9vcCA9IGZ1bmN0aW9uKCkge307XG5cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNpbXBsZVNpbmtCYXNlIGltcGxlbWVudHMgU2luayB7XG4gIHByZUNvbW1pdEFjdGlvbjogKGFjdGlvbjogQWN0aW9uKSA9PiB2b2lkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBBY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFByb21pc2VMaWtlPEFjdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IE9ic2VydmFibGU8QWN0aW9uPiA9IE5vb3A7XG4gIHBvc3RDb21taXRBY3Rpb246IChhY3Rpb246IEFjdGlvbikgPT4gdm9pZCB8IE9ic2VydmFibGU8dm9pZD4gPSBOb29wO1xuICBwcmVDb21taXQ6ICgpID0+IHZvaWQgfCBPYnNlcnZhYmxlPHZvaWQ+ID0gTm9vcDtcbiAgcG9zdENvbW1pdDogKCkgPT4gdm9pZCB8IE9ic2VydmFibGU8dm9pZD4gPSBOb29wO1xuXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfdmFsaWRhdGVGaWxlRXhpc3RzKHA6IHN0cmluZyk6IE9ic2VydmFibGU8Ym9vbGVhbj47XG5cbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9vdmVyd3JpdGVGaWxlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyKTogT2JzZXJ2YWJsZTx2b2lkPjtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9jcmVhdGVGaWxlKHBhdGg6IHN0cmluZywgY29udGVudDogQnVmZmVyKTogT2JzZXJ2YWJsZTx2b2lkPjtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IF9yZW5hbWVGaWxlKHBhdGg6IHN0cmluZywgdG86IHN0cmluZyk6IE9ic2VydmFibGU8dm9pZD47XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfZGVsZXRlRmlsZShwYXRoOiBzdHJpbmcpOiBPYnNlcnZhYmxlPHZvaWQ+O1xuXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBfZG9uZSgpOiBPYnNlcnZhYmxlPHZvaWQ+O1xuXG4gIHByb3RlY3RlZCBfZmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuICBwcm90ZWN0ZWQgX2ZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24ocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3ZhbGlkYXRlT3ZlcndyaXRlQWN0aW9uKGFjdGlvbjogT3ZlcndyaXRlRmlsZUFjdGlvbik6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZUZpbGVFeGlzdHMoYWN0aW9uLnBhdGgpXG4gICAgICAubWFwKGIgPT4geyBpZiAoIWIpIHsgdGhpcy5fZmlsZURvZXNOb3RFeGlzdEV4Y2VwdGlvbihhY3Rpb24ucGF0aCk7IH0gfSk7XG4gIH1cbiAgcHJvdGVjdGVkIF92YWxpZGF0ZUNyZWF0ZUFjdGlvbihhY3Rpb246IENyZWF0ZUZpbGVBY3Rpb24pOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVGaWxlRXhpc3RzKGFjdGlvbi5wYXRoKVxuICAgICAgLm1hcChiID0+IHsgaWYgKGIpIHsgdGhpcy5fZmlsZUFscmVhZHlFeGlzdEV4Y2VwdGlvbihhY3Rpb24ucGF0aCk7IH0gfSk7XG4gIH1cbiAgcHJvdGVjdGVkIF92YWxpZGF0ZVJlbmFtZUFjdGlvbihhY3Rpb246IFJlbmFtZUZpbGVBY3Rpb24pOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVGaWxlRXhpc3RzKGFjdGlvbi5wYXRoKVxuICAgICAgLm1hcChiID0+IHsgaWYgKCFiKSB7IHRoaXMuX2ZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24oYWN0aW9uLnBhdGgpOyB9IH0pXG4gICAgICAubWVyZ2VNYXAoKCkgPT4gdGhpcy5fdmFsaWRhdGVGaWxlRXhpc3RzKGFjdGlvbi50bykpXG4gICAgICAubWFwKGIgPT4geyBpZiAoYikgeyB0aGlzLl9maWxlQWxyZWFkeUV4aXN0RXhjZXB0aW9uKGFjdGlvbi50byk7IH0gfSk7XG4gIH1cbiAgcHJvdGVjdGVkIF92YWxpZGF0ZURlbGV0ZUFjdGlvbihhY3Rpb246IERlbGV0ZUZpbGVBY3Rpb24pOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVGaWxlRXhpc3RzKGFjdGlvbi5wYXRoKVxuICAgICAgLm1hcChiID0+IHsgaWYgKCFiKSB7IHRoaXMuX2ZpbGVEb2VzTm90RXhpc3RFeGNlcHRpb24oYWN0aW9uLnBhdGgpOyB9IH0pO1xuICB9XG5cbiAgdmFsaWRhdGVTaW5nbGVBY3Rpb24oYWN0aW9uOiBBY3Rpb24pOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICBzd2l0Y2ggKGFjdGlvbi5raW5kKSB7XG4gICAgICBjYXNlICdvJzogcmV0dXJuIHRoaXMuX3ZhbGlkYXRlT3ZlcndyaXRlQWN0aW9uKGFjdGlvbik7XG4gICAgICBjYXNlICdjJzogcmV0dXJuIHRoaXMuX3ZhbGlkYXRlQ3JlYXRlQWN0aW9uKGFjdGlvbik7XG4gICAgICBjYXNlICdyJzogcmV0dXJuIHRoaXMuX3ZhbGlkYXRlUmVuYW1lQWN0aW9uKGFjdGlvbik7XG4gICAgICBjYXNlICdkJzogcmV0dXJuIHRoaXMuX3ZhbGlkYXRlRGVsZXRlQWN0aW9uKGFjdGlvbik7XG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgVW5rbm93bkFjdGlvbkV4Y2VwdGlvbihhY3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIGNvbW1pdFNpbmdsZUFjdGlvbihhY3Rpb246IEFjdGlvbik6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PHZvaWQ+KClcbiAgICAgIC5jb25jYXQobmV3IE9ic2VydmFibGU8dm9pZD4ob2JzZXJ2ZXIgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZVNpbmdsZUFjdGlvbihhY3Rpb24pLnN1YnNjcmliZShvYnNlcnZlcik7XG4gICAgICB9KSlcbiAgICAgIC5jb25jYXQobmV3IE9ic2VydmFibGU8dm9pZD4ob2JzZXJ2ZXIgPT4ge1xuICAgICAgICBsZXQgY29tbWl0dGVkID0gbnVsbDtcbiAgICAgICAgc3dpdGNoIChhY3Rpb24ua2luZCkge1xuICAgICAgICAgIGNhc2UgJ28nOiBjb21taXR0ZWQgPSB0aGlzLl9vdmVyd3JpdGVGaWxlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2MnOiBjb21taXR0ZWQgPSB0aGlzLl9jcmVhdGVGaWxlKGFjdGlvbi5wYXRoLCBhY3Rpb24uY29udGVudCk7IGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3InOiBjb21taXR0ZWQgPSB0aGlzLl9yZW5hbWVGaWxlKGFjdGlvbi5wYXRoLCBhY3Rpb24udG8pOyBicmVhaztcbiAgICAgICAgICBjYXNlICdkJzogY29tbWl0dGVkID0gdGhpcy5fZGVsZXRlRmlsZShhY3Rpb24ucGF0aCk7IGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbW1pdHRlZCkge1xuICAgICAgICAgIGNvbW1pdHRlZC5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgfVxuXG4gIGNvbW1pdCh0cmVlOiBUcmVlKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgY29uc3QgYWN0aW9ucyA9IE9ic2VydmFibGUuZnJvbSh0cmVlLmFjdGlvbnMpO1xuXG4gICAgcmV0dXJuICh0aGlzLnByZUNvbW1pdCgpIHx8IE9ic2VydmFibGUuZW1wdHk8dm9pZD4oKSlcbiAgICAgIC5jb25jYXQoT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiBhY3Rpb25zKSlcbiAgICAgIC5jb25jYXRNYXAoKGFjdGlvbjogQWN0aW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IG1heWJlQWN0aW9uID0gdGhpcy5wcmVDb21taXRBY3Rpb24oYWN0aW9uKTtcbiAgICAgICAgaWYgKCFtYXliZUFjdGlvbikge1xuICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGFjdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBY3Rpb24obWF5YmVBY3Rpb24pKSB7XG4gICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobWF5YmVBY3Rpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBtYXliZUFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5tZXJnZU1hcCgoYWN0aW9uOiBBY3Rpb24pID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tbWl0U2luZ2xlQWN0aW9uKGFjdGlvbikuaWdub3JlRWxlbWVudHMoKS5jb25jYXQoW2FjdGlvbl0pO1xuICAgICAgfSlcbiAgICAgIC5tZXJnZU1hcCgoYWN0aW9uOiBBY3Rpb24pID0+IHRoaXMucG9zdENvbW1pdEFjdGlvbihhY3Rpb24pIHx8IE9ic2VydmFibGUuZW1wdHk8dm9pZD4oKSlcbiAgICAgIC5jb25jYXQoT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiB0aGlzLl9kb25lKCkpKVxuICAgICAgLmNvbmNhdChPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHRoaXMucG9zdENvbW1pdCgpIHx8IE9ic2VydmFibGUuZW1wdHk8dm9pZD4oKSkpO1xuICB9XG59XG4iXX0=