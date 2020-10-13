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
class UnknownActionException extends exception_1.BaseException {
    constructor(action) { super(`Unknown action: "${action.kind}".`); }
}
exports.UnknownActionException = UnknownActionException;
let _id = 1;
class ActionList {
    constructor() {
        this._actions = [];
    }
    _action(action) {
        this._actions.push(Object.assign({
            id: _id++,
            parent: this._actions[this._actions.length - 1] || 0,
        }, action));
    }
    create(path, content) {
        this._action({ kind: 'c', path, content });
    }
    overwrite(path, content) {
        this._action({ kind: 'o', path, content });
    }
    rename(path, to) {
        this._action({ kind: 'r', path, to });
    }
    delete(path) {
        this._action({ kind: 'd', path });
    }
    optimize() {
        const actions = this._actions;
        const deleted = new Set();
        this._actions = [];
        // Handles files we create.
        for (let i = 0; i < actions.length; i++) {
            const iAction = actions[i];
            if (iAction.kind == 'c') {
                let path = iAction.path;
                let content = iAction.content;
                let toDelete = false;
                deleted.delete(path);
                for (let j = i + 1; j < actions.length; j++) {
                    const action = actions[j];
                    if (path == action.path) {
                        switch (action.kind) {
                            case 'c':
                                content = action.content;
                                actions.splice(j--, 1);
                                break;
                            case 'o':
                                content = action.content;
                                actions.splice(j--, 1);
                                break;
                            case 'r':
                                path = action.to;
                                actions.splice(j--, 1);
                                break;
                            case 'd':
                                toDelete = true;
                                actions.splice(j--, 1);
                                break;
                        }
                    }
                    if (toDelete) {
                        break;
                    }
                }
                if (!toDelete) {
                    this.create(path, content);
                }
                else {
                    deleted.add(path);
                }
            }
            else if (deleted.has(iAction.path)) {
                // DoNothing
            }
            else {
                switch (iAction.kind) {
                    case 'o':
                        this.overwrite(iAction.path, iAction.content);
                        break;
                    case 'r':
                        this.rename(iAction.path, iAction.to);
                        break;
                    case 'd':
                        this.delete(iAction.path);
                        break;
                }
            }
        }
    }
    push(action) { this._actions.push(action); }
    get(i) { return this._actions[i]; }
    has(action) {
        for (let i = 0; i < this._actions.length; i++) {
            const a = this._actions[i];
            if (a.id == action.id) {
                return true;
            }
            if (a.id > action.id) {
                return false;
            }
        }
        return false;
    }
    find(predicate) {
        return this._actions.find(predicate) || null;
    }
    forEach(fn, thisArg) {
        this._actions.forEach(fn, thisArg);
    }
    get length() { return this._actions.length; }
    [Symbol.iterator]() { return this._actions[Symbol.iterator](); }
}
exports.ActionList = ActionList;
function isContentAction(action) {
    return action.kind == 'c' || action.kind == 'o';
}
exports.isContentAction = isContentAction;
function isAction(action) {
    const kind = action && action.kind;
    return action !== null
        && typeof action.id == 'number'
        && typeof action.path == 'string'
        && (kind == 'c' || kind == 'o' || kind == 'r' || kind == 'd');
}
exports.isAction = isAction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uLmpzIiwic291cmNlUm9vdCI6Ii9Vc2Vycy9oYW5zbC9Tb3VyY2VzL2RldmtpdC8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3RyZWUvYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsc0RBQXVEO0FBSXZELDRCQUFvQyxTQUFRLHlCQUFhO0lBQ3ZELFlBQVksTUFBYyxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVFO0FBRkQsd0RBRUM7QUFnQkQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBRVo7SUFBQTtRQUNVLGFBQVEsR0FBYSxFQUFFLENBQUM7SUE0RmxDLENBQUM7SUExRlcsT0FBTyxDQUFDLE1BQXVCO1FBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDL0IsRUFBRSxFQUFFLEdBQUcsRUFBRTtZQUNULE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDckQsRUFBRSxNQUFNLENBQVcsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBbUIsRUFBRSxPQUFlO1FBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFDRCxTQUFTLENBQUMsSUFBbUIsRUFBRSxPQUFlO1FBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBbUIsRUFBRSxFQUFp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QUFJLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFQRCw0QkFPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IFNjaGVtYXRpY1BhdGggfSBmcm9tICcuLi91dGlsaXR5L3BhdGgnO1xuXG5cbmV4cG9ydCBjbGFzcyBVbmtub3duQWN0aW9uRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGFjdGlvbjogQWN0aW9uKSB7IHN1cGVyKGBVbmtub3duIGFjdGlvbjogXCIke2FjdGlvbi5raW5kfVwiLmApOyB9XG59XG5cblxuZXhwb3J0IHR5cGUgQWN0aW9uID0gQ3JlYXRlRmlsZUFjdGlvblxuICAgICAgICAgICAgICAgICAgIHwgT3ZlcndyaXRlRmlsZUFjdGlvblxuICAgICAgICAgICAgICAgICAgIHwgUmVuYW1lRmlsZUFjdGlvblxuICAgICAgICAgICAgICAgICAgIHwgRGVsZXRlRmlsZUFjdGlvbjtcblxuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbkJhc2Uge1xuICByZWFkb25seSBpZDogbnVtYmVyO1xuICByZWFkb25seSBwYXJlbnQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgcGF0aDogU2NoZW1hdGljUGF0aDtcbn1cblxuXG5sZXQgX2lkID0gMTtcblxuZXhwb3J0IGNsYXNzIEFjdGlvbkxpc3QgaW1wbGVtZW50cyBJdGVyYWJsZTxBY3Rpb24+IHtcbiAgcHJpdmF0ZSBfYWN0aW9uczogQWN0aW9uW10gPSBbXTtcblxuICBwcm90ZWN0ZWQgX2FjdGlvbihhY3Rpb246IFBhcnRpYWw8QWN0aW9uPikge1xuICAgIHRoaXMuX2FjdGlvbnMucHVzaChPYmplY3QuYXNzaWduKHtcbiAgICAgIGlkOiBfaWQrKyxcbiAgICAgIHBhcmVudDogdGhpcy5fYWN0aW9uc1t0aGlzLl9hY3Rpb25zLmxlbmd0aCAtIDFdIHx8IDAsXG4gICAgfSwgYWN0aW9uKSBhcyBBY3Rpb24pO1xuICB9XG5cbiAgY3JlYXRlKHBhdGg6IFNjaGVtYXRpY1BhdGgsIGNvbnRlbnQ6IEJ1ZmZlcikge1xuICAgIHRoaXMuX2FjdGlvbih7IGtpbmQ6ICdjJywgcGF0aCwgY29udGVudCB9KTtcbiAgfVxuICBvdmVyd3JpdGUocGF0aDogU2NoZW1hdGljUGF0aCwgY29udGVudDogQnVmZmVyKSB7XG4gICAgdGhpcy5fYWN0aW9uKHsga2luZDogJ28nLCBwYXRoLCBjb250ZW50IH0pO1xuICB9XG4gIHJlbmFtZShwYXRoOiBTY2hlbWF0aWNQYXRoLCB0bzogU2NoZW1hdGljUGF0aCkge1xuICAgIHRoaXMuX2FjdGlvbih7IGtpbmQ6ICdyJywgcGF0aCwgdG8gfSk7XG4gIH1cbiAgZGVsZXRlKHBhdGg6IFNjaGVtYXRpY1BhdGgpIHtcbiAgICB0aGlzLl9hY3Rpb24oeyBraW5kOiAnZCcsIHBhdGggfSk7XG4gIH1cblxuXG4gIG9wdGltaXplKCkge1xuICAgIGNvbnN0IGFjdGlvbnMgPSB0aGlzLl9hY3Rpb25zO1xuICAgIGNvbnN0IGRlbGV0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICB0aGlzLl9hY3Rpb25zID0gW107XG5cbiAgICAvLyBIYW5kbGVzIGZpbGVzIHdlIGNyZWF0ZS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGlBY3Rpb24gPSBhY3Rpb25zW2ldO1xuICAgICAgaWYgKGlBY3Rpb24ua2luZCA9PSAnYycpIHtcbiAgICAgICAgbGV0IHBhdGggPSBpQWN0aW9uLnBhdGg7XG4gICAgICAgIGxldCBjb250ZW50ID0gaUFjdGlvbi5jb250ZW50O1xuICAgICAgICBsZXQgdG9EZWxldGUgPSBmYWxzZTtcbiAgICAgICAgZGVsZXRlZC5kZWxldGUocGF0aCk7XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgYWN0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGFjdGlvbnNbal07XG4gICAgICAgICAgaWYgKHBhdGggPT0gYWN0aW9uLnBhdGgpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uLmtpbmQpIHtcbiAgICAgICAgICAgICAgY2FzZSAnYyc6IGNvbnRlbnQgPSBhY3Rpb24uY29udGVudDsgYWN0aW9ucy5zcGxpY2Uoai0tLCAxKTsgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgJ28nOiBjb250ZW50ID0gYWN0aW9uLmNvbnRlbnQ7IGFjdGlvbnMuc3BsaWNlKGotLSwgMSk7IGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlICdyJzogcGF0aCA9IGFjdGlvbi50bzsgYWN0aW9ucy5zcGxpY2Uoai0tLCAxKTsgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgJ2QnOiB0b0RlbGV0ZSA9IHRydWU7IGFjdGlvbnMuc3BsaWNlKGotLSwgMSk7IGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodG9EZWxldGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdG9EZWxldGUpIHtcbiAgICAgICAgICB0aGlzLmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWxldGVkLmFkZChwYXRoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChkZWxldGVkLmhhcyhpQWN0aW9uLnBhdGgpKSB7XG4gICAgICAgIC8vIERvTm90aGluZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChpQWN0aW9uLmtpbmQpIHtcbiAgICAgICAgICBjYXNlICdvJzogdGhpcy5vdmVyd3JpdGUoaUFjdGlvbi5wYXRoLCBpQWN0aW9uLmNvbnRlbnQpOyBicmVhaztcbiAgICAgICAgICBjYXNlICdyJzogdGhpcy5yZW5hbWUoaUFjdGlvbi5wYXRoLCBpQWN0aW9uLnRvKTsgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZCc6IHRoaXMuZGVsZXRlKGlBY3Rpb24ucGF0aCk7IGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVzaChhY3Rpb246IEFjdGlvbikgeyB0aGlzLl9hY3Rpb25zLnB1c2goYWN0aW9uKTsgfVxuICBnZXQoaTogbnVtYmVyKSB7IHJldHVybiB0aGlzLl9hY3Rpb25zW2ldOyB9XG4gIGhhcyhhY3Rpb246IEFjdGlvbikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYSA9IHRoaXMuX2FjdGlvbnNbaV07XG4gICAgICBpZiAoYS5pZCA9PSBhY3Rpb24uaWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoYS5pZCA+IGFjdGlvbi5pZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZpbmQocHJlZGljYXRlOiAodmFsdWU6IEFjdGlvbikgPT4gYm9vbGVhbik6IEFjdGlvbiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9hY3Rpb25zLmZpbmQocHJlZGljYXRlKSB8fCBudWxsO1xuICB9XG4gIGZvckVhY2goZm46ICh2YWx1ZTogQWN0aW9uLCBpbmRleDogbnVtYmVyLCBhcnJheTogQWN0aW9uW10pID0+IHZvaWQsIHRoaXNBcmc/OiB7fSkge1xuICAgIHRoaXMuX2FjdGlvbnMuZm9yRWFjaChmbiwgdGhpc0FyZyk7XG4gIH1cbiAgZ2V0IGxlbmd0aCgpIHsgcmV0dXJuIHRoaXMuX2FjdGlvbnMubGVuZ3RoOyB9XG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkgeyByZXR1cm4gdGhpcy5fYWN0aW9uc1tTeW1ib2wuaXRlcmF0b3JdKCk7IH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZW50QWN0aW9uKGFjdGlvbjogQWN0aW9uKTogYWN0aW9uIGlzIENyZWF0ZUZpbGVBY3Rpb24gfCBPdmVyd3JpdGVGaWxlQWN0aW9uIHtcbiAgcmV0dXJuIGFjdGlvbi5raW5kID09ICdjJyB8fCBhY3Rpb24ua2luZCA9PSAnbyc7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQWN0aW9uKGFjdGlvbjogYW55KTogYWN0aW9uIGlzIEFjdGlvbiB7ICAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWFueVxuICBjb25zdCBraW5kID0gYWN0aW9uICYmIGFjdGlvbi5raW5kO1xuXG4gIHJldHVybiBhY3Rpb24gIT09IG51bGxcbiAgICAgICYmIHR5cGVvZiBhY3Rpb24uaWQgPT0gJ251bWJlcidcbiAgICAgICYmIHR5cGVvZiBhY3Rpb24ucGF0aCA9PSAnc3RyaW5nJ1xuICAgICAgJiYgKGtpbmQgPT0gJ2MnIHx8IGtpbmQgPT0gJ28nIHx8IGtpbmQgPT0gJ3InIHx8IGtpbmQgPT0gJ2QnKTtcbn1cblxuXG4vLyBDcmVhdGUgYSBmaWxlLiBJZiB0aGUgZmlsZSBhbHJlYWR5IGV4aXN0cyB0aGVuIHRoaXMgaXMgYW4gZXJyb3IuXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUZpbGVBY3Rpb24gZXh0ZW5kcyBBY3Rpb25CYXNlIHtcbiAgcmVhZG9ubHkga2luZDogJ2MnO1xuICByZWFkb25seSBjb250ZW50OiBCdWZmZXI7XG59XG5cbi8vIE92ZXJ3cml0ZSBhIGZpbGUuIElmIHRoZSBmaWxlIGRvZXMgbm90IGFscmVhZHkgZXhpc3QsIHRoaXMgaXMgYW4gZXJyb3IuXG5leHBvcnQgaW50ZXJmYWNlIE92ZXJ3cml0ZUZpbGVBY3Rpb24gZXh0ZW5kcyBBY3Rpb25CYXNlIHtcbiAgcmVhZG9ubHkga2luZDogJ28nO1xuICByZWFkb25seSBjb250ZW50OiBCdWZmZXI7XG59XG5cbi8vIE1vdmUgYSBmaWxlIGZyb20gb25lIHBhdGggdG8gYW5vdGhlci4gSWYgdGhlIHNvdXJjZSBmaWxlcyBkb2VzIG5vdCBleGlzdCwgdGhpcyBpcyBhbiBlcnJvci5cbi8vIElmIHRoZSB0YXJnZXQgcGF0aCBhbHJlYWR5IGV4aXN0cywgdGhpcyBpcyBhbiBlcnJvci5cbmV4cG9ydCBpbnRlcmZhY2UgUmVuYW1lRmlsZUFjdGlvbiBleHRlbmRzIEFjdGlvbkJhc2Uge1xuICByZWFkb25seSBraW5kOiAncic7XG4gIHJlYWRvbmx5IHRvOiBTY2hlbWF0aWNQYXRoO1xufVxuXG4vLyBEZWxldGUgYSBmaWxlLiBJZiB0aGUgZmlsZSBkb2VzIG5vdCBleGlzdCwgdGhpcyBpcyBhbiBlcnJvci5cbmV4cG9ydCBpbnRlcmZhY2UgRGVsZXRlRmlsZUFjdGlvbiBleHRlbmRzIEFjdGlvbkJhc2Uge1xuICByZWFkb25seSBraW5kOiAnZCc7XG59XG4iXX0=