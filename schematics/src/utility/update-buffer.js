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
const linked_list_1 = require("./linked-list");
class IndexOutOfBoundException extends exception_1.BaseException {
    constructor(index, min, max = Infinity) {
        super(`Index ${index} outside of range [${min}, ${max}].`);
    }
}
exports.IndexOutOfBoundException = IndexOutOfBoundException;
class ContentCannotBeRemovedException extends exception_1.BaseException {
    constructor() {
        super(`User tried to remove content that was marked essential.`);
    }
}
exports.ContentCannotBeRemovedException = ContentCannotBeRemovedException;
/**
 * A Chunk description, including left/right content that has been inserted.
 * If _left/_right is null, this means that content was deleted. If the _content is null,
 * it means the content itself was deleted.
 *
 * @see UpdateBuffer
 */
class Chunk {
    constructor(start, end, originalContent) {
        this.start = start;
        this.end = end;
        this.originalContent = originalContent;
        this._left = Buffer.alloc(0);
        this._right = Buffer.alloc(0);
        this._assertLeft = false;
        this._assertRight = false;
        this.next = null;
        this._content = originalContent.slice(start, end);
    }
    get length() {
        return (this._left ? this._left.length : 0)
            + (this._content ? this._content.length : 0)
            + (this._right ? this._right.length : 0);
    }
    toString(encoding = 'utf-8') {
        return (this._left ? this._left.toString(encoding) : '')
            + (this._content ? this._content.toString(encoding) : '')
            + (this._right ? this._right.toString(encoding) : '');
    }
    slice(start) {
        if (start < this.start || start > this.end) {
            throw new IndexOutOfBoundException(start, this.start, this.end);
        }
        // Update _content to the new indices.
        const newChunk = new Chunk(start, this.end, this.originalContent);
        // If this chunk has _content, reslice the original _content. We move the _right so we are not
        // losing any data here. If this chunk has been deleted, the next chunk should also be deleted.
        if (this._content) {
            this._content = this.originalContent.slice(this.start, start);
        }
        else {
            newChunk._content = this._content;
            if (this._right === null) {
                newChunk._left = null;
            }
        }
        this.end = start;
        // Move _right to the new chunk.
        newChunk._right = this._right;
        this._right = this._right && Buffer.alloc(0);
        // Update essentials.
        if (this._assertRight) {
            newChunk._assertRight = true;
            this._assertRight = false;
        }
        // Update the linked list.
        newChunk.next = this.next;
        this.next = newChunk;
        return newChunk;
    }
    append(buffer, essential) {
        if (!this._right) {
            if (essential) {
                throw new ContentCannotBeRemovedException();
            }
            return;
        }
        const outro = this._right;
        this._right = Buffer.alloc(outro.length + buffer.length);
        outro.copy(this._right, 0);
        buffer.copy(this._right, outro.length);
        if (essential) {
            this._assertRight = true;
        }
    }
    prepend(buffer, essential) {
        if (!this._left) {
            if (essential) {
                throw new ContentCannotBeRemovedException();
            }
            return;
        }
        const intro = this._left;
        this._left = Buffer.alloc(intro.length + buffer.length);
        intro.copy(this._left, 0);
        buffer.copy(this._left, intro.length);
        if (essential) {
            this._assertLeft = true;
        }
    }
    assert(left, _content, right) {
        if (left) {
            if (this._assertLeft) {
                throw new ContentCannotBeRemovedException();
            }
        }
        if (right) {
            if (this._assertRight) {
                throw new ContentCannotBeRemovedException();
            }
        }
    }
    remove(left, content, right) {
        if (left) {
            if (this._assertLeft) {
                throw new ContentCannotBeRemovedException();
            }
            this._left = null;
        }
        if (content) {
            this._content = null;
        }
        if (right) {
            if (this._assertRight) {
                throw new ContentCannotBeRemovedException();
            }
            this._right = null;
        }
    }
    copy(target, start) {
        if (this._left) {
            this._left.copy(target, start);
            start += this._left.length;
        }
        if (this._content) {
            this._content.copy(target, start);
            start += this._content.length;
        }
        if (this._right) {
            this._right.copy(target, start);
            start += this._right.length;
        }
        return start;
    }
}
exports.Chunk = Chunk;
/**
 * An utility class that allows buffers to be inserted to the _right or _left, or deleted, while
 * keeping indices to the original buffer.
 *
 * The constructor takes an original buffer, and keeps it into a linked list of chunks, smaller
 * buffers that keep track of _content inserted to the _right or _left of it.
 *
 * Since the Node Buffer structure is non-destructive when slicing, we try to use slicing to create
 * new chunks, and always keep chunks pointing to the original content.
 */
class UpdateBuffer {
    constructor(_originalContent) {
        this._originalContent = _originalContent;
        this._linkedList = new linked_list_1.LinkedList(new Chunk(0, _originalContent.length, _originalContent));
    }
    _assertIndex(index) {
        if (index < 0 || index > this._originalContent.length) {
            throw new IndexOutOfBoundException(index, 0, this._originalContent.length);
        }
    }
    _slice(start) {
        this._assertIndex(start);
        // Find the chunk by going through the list.
        const h = this._linkedList.find(chunk => start <= chunk.end);
        if (!h) {
            throw Error('Chunk cannot be found.');
        }
        if (start == h.end && h.next !== null) {
            return [h, h.next];
        }
        return [h, h.slice(start)];
    }
    get length() {
        return this._linkedList.reduce((acc, chunk) => acc + chunk.length, 0);
    }
    get original() {
        return this._originalContent;
    }
    toString(encoding = 'utf-8') {
        return this._linkedList.reduce((acc, chunk) => acc + chunk.toString(encoding), '');
    }
    generate() {
        const result = Buffer.allocUnsafe(this.length);
        let i = 0;
        this._linkedList.forEach(chunk => {
            chunk.copy(result, i);
            i += chunk.length;
        });
        return result;
    }
    insertLeft(index, content, assert = false) {
        this._slice(index)[0].append(content, assert);
    }
    insertRight(index, content, assert = false) {
        this._slice(index)[1].prepend(content, assert);
    }
    remove(index, length) {
        const end = index + length;
        const first = this._slice(index)[1];
        const last = this._slice(end)[1];
        let curr;
        for (curr = first; curr && curr !== last; curr = curr.next) {
            curr.assert(curr !== first, curr !== last, curr === first);
        }
        for (curr = first; curr && curr !== last; curr = curr.next) {
            curr.remove(curr !== first, curr !== last, curr === first);
        }
        if (curr) {
            curr.remove(true, false, false);
        }
    }
}
exports.UpdateBuffer = UpdateBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvaGFuc2wvU291cmNlcy9kZXZraXQvIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy91dGlsaXR5L3VwZGF0ZS1idWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCxzREFBdUQ7QUFDdkQsK0NBQTJDO0FBRzNDLDhCQUFzQyxTQUFRLHlCQUFhO0lBQ3pELFlBQVksS0FBYSxFQUFFLEdBQVcsRUFBRSxHQUFHLEdBQUcsUUFBUTtRQUNwRCxLQUFLLENBQUMsU0FBUyxLQUFLLHNCQUFzQixHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUFKRCw0REFJQztBQUNELHFDQUE2QyxTQUFRLHlCQUFhO0lBQ2hFO1FBQ0UsS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGO0FBSkQsMEVBSUM7QUFHRDs7Ozs7O0dBTUc7QUFDSDtJQVVFLFlBQW1CLEtBQWEsRUFBUyxHQUFXLEVBQVMsZUFBdUI7UUFBakUsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUFTLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBUyxvQkFBZSxHQUFmLGVBQWUsQ0FBUTtRQVI1RSxVQUFLLEdBQWtCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsV0FBTSxHQUFrQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXhDLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBRTdCLFNBQUksR0FBaUIsSUFBSSxDQUFDO1FBR3hCLElBQUksQ0FBQyxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE1BQU0s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QyxDQUFDO1FBRWpDLElBQUksSUFBa0IsQ0FBQztRQUN2QixHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxFQUFFLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxFQUFFLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUEzRUQsb0NBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJy4uL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuaW1wb3J0IHsgTGlua2VkTGlzdCB9IGZyb20gJy4vbGlua2VkLWxpc3QnO1xuXG5cbmV4cG9ydCBjbGFzcyBJbmRleE91dE9mQm91bmRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoaW5kZXg6IG51bWJlciwgbWluOiBudW1iZXIsIG1heCA9IEluZmluaXR5KSB7XG4gICAgc3VwZXIoYEluZGV4ICR7aW5kZXh9IG91dHNpZGUgb2YgcmFuZ2UgWyR7bWlufSwgJHttYXh9XS5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoYFVzZXIgdHJpZWQgdG8gcmVtb3ZlIGNvbnRlbnQgdGhhdCB3YXMgbWFya2VkIGVzc2VudGlhbC5gKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQSBDaHVuayBkZXNjcmlwdGlvbiwgaW5jbHVkaW5nIGxlZnQvcmlnaHQgY29udGVudCB0aGF0IGhhcyBiZWVuIGluc2VydGVkLlxuICogSWYgX2xlZnQvX3JpZ2h0IGlzIG51bGwsIHRoaXMgbWVhbnMgdGhhdCBjb250ZW50IHdhcyBkZWxldGVkLiBJZiB0aGUgX2NvbnRlbnQgaXMgbnVsbCxcbiAqIGl0IG1lYW5zIHRoZSBjb250ZW50IGl0c2VsZiB3YXMgZGVsZXRlZC5cbiAqXG4gKiBAc2VlIFVwZGF0ZUJ1ZmZlclxuICovXG5leHBvcnQgY2xhc3MgQ2h1bmsge1xuICBwcml2YXRlIF9jb250ZW50OiBCdWZmZXIgfCBudWxsO1xuICBwcml2YXRlIF9sZWZ0OiBCdWZmZXIgfCBudWxsID0gQnVmZmVyLmFsbG9jKDApO1xuICBwcml2YXRlIF9yaWdodDogQnVmZmVyIHwgbnVsbCA9IEJ1ZmZlci5hbGxvYygwKTtcblxuICBwcml2YXRlIF9hc3NlcnRMZWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgX2Fzc2VydFJpZ2h0ID0gZmFsc2U7XG5cbiAgbmV4dDogQ2h1bmsgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgc3RhcnQ6IG51bWJlciwgcHVibGljIGVuZDogbnVtYmVyLCBwdWJsaWMgb3JpZ2luYWxDb250ZW50OiBCdWZmZXIpIHtcbiAgICB0aGlzLl9jb250ZW50ID0gb3JpZ2luYWxDb250ZW50LnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gKHRoaXMuX2xlZnQgPyB0aGlzLl9sZWZ0Lmxlbmd0aCA6IDApXG4gICAgICAgICArICh0aGlzLl9jb250ZW50ID8gdGhpcy5fY29udGVudC5sZW5ndGggOiAwKVxuICAgICAgICAgKyAodGhpcy5fcmlnaHQgPyB0aGlzLl9yaWdodC5sZW5ndGggOiAwKTtcbiAgfVxuICB0b1N0cmluZyhlbmNvZGluZyA9ICd1dGYtOCcpIHtcbiAgICByZXR1cm4gKHRoaXMuX2xlZnQgPyB0aGlzLl9sZWZ0LnRvU3RyaW5nKGVuY29kaW5nKSA6ICcnKVxuICAgICAgICAgKyAodGhpcy5fY29udGVudCA/IHRoaXMuX2NvbnRlbnQudG9TdHJpbmcoZW5jb2RpbmcpIDogJycpXG4gICAgICAgICArICh0aGlzLl9yaWdodCA/IHRoaXMuX3JpZ2h0LnRvU3RyaW5nKGVuY29kaW5nKSA6ICcnKTtcbiAgfVxuXG4gIHNsaWNlKHN0YXJ0OiBudW1iZXIpIHtcbiAgICBpZiAoc3RhcnQgPCB0aGlzLnN0YXJ0IHx8IHN0YXJ0ID4gdGhpcy5lbmQpIHtcbiAgICAgIHRocm93IG5ldyBJbmRleE91dE9mQm91bmRFeGNlcHRpb24oc3RhcnQsIHRoaXMuc3RhcnQsIHRoaXMuZW5kKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgX2NvbnRlbnQgdG8gdGhlIG5ldyBpbmRpY2VzLlxuICAgIGNvbnN0IG5ld0NodW5rID0gbmV3IENodW5rKHN0YXJ0LCB0aGlzLmVuZCwgdGhpcy5vcmlnaW5hbENvbnRlbnQpO1xuXG4gICAgLy8gSWYgdGhpcyBjaHVuayBoYXMgX2NvbnRlbnQsIHJlc2xpY2UgdGhlIG9yaWdpbmFsIF9jb250ZW50LiBXZSBtb3ZlIHRoZSBfcmlnaHQgc28gd2UgYXJlIG5vdFxuICAgIC8vIGxvc2luZyBhbnkgZGF0YSBoZXJlLiBJZiB0aGlzIGNodW5rIGhhcyBiZWVuIGRlbGV0ZWQsIHRoZSBuZXh0IGNodW5rIHNob3VsZCBhbHNvIGJlIGRlbGV0ZWQuXG4gICAgaWYgKHRoaXMuX2NvbnRlbnQpIHtcbiAgICAgIHRoaXMuX2NvbnRlbnQgPSB0aGlzLm9yaWdpbmFsQ29udGVudC5zbGljZSh0aGlzLnN0YXJ0LCBzdGFydCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0NodW5rLl9jb250ZW50ID0gdGhpcy5fY29udGVudDtcbiAgICAgIGlmICh0aGlzLl9yaWdodCA9PT0gbnVsbCkge1xuICAgICAgICBuZXdDaHVuay5fbGVmdCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZW5kID0gc3RhcnQ7XG5cbiAgICAvLyBNb3ZlIF9yaWdodCB0byB0aGUgbmV3IGNodW5rLlxuICAgIG5ld0NodW5rLl9yaWdodCA9IHRoaXMuX3JpZ2h0O1xuICAgIHRoaXMuX3JpZ2h0ID0gdGhpcy5fcmlnaHQgJiYgQnVmZmVyLmFsbG9jKDApO1xuXG4gICAgLy8gVXBkYXRlIGVzc2VudGlhbHMuXG4gICAgaWYgKHRoaXMuX2Fzc2VydFJpZ2h0KSB7XG4gICAgICBuZXdDaHVuay5fYXNzZXJ0UmlnaHQgPSB0cnVlO1xuICAgICAgdGhpcy5fYXNzZXJ0UmlnaHQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtlZCBsaXN0LlxuICAgIG5ld0NodW5rLm5leHQgPSB0aGlzLm5leHQ7XG4gICAgdGhpcy5uZXh0ID0gbmV3Q2h1bms7XG5cbiAgICByZXR1cm4gbmV3Q2h1bms7XG4gIH1cblxuICBhcHBlbmQoYnVmZmVyOiBCdWZmZXIsIGVzc2VudGlhbDogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5fcmlnaHQpIHtcbiAgICAgIGlmIChlc3NlbnRpYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24oKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHJvID0gdGhpcy5fcmlnaHQ7XG4gICAgdGhpcy5fcmlnaHQgPSBCdWZmZXIuYWxsb2Mob3V0cm8ubGVuZ3RoICsgYnVmZmVyLmxlbmd0aCk7XG4gICAgb3V0cm8uY29weSh0aGlzLl9yaWdodCwgMCk7XG4gICAgYnVmZmVyLmNvcHkodGhpcy5fcmlnaHQsIG91dHJvLmxlbmd0aCk7XG5cbiAgICBpZiAoZXNzZW50aWFsKSB7XG4gICAgICB0aGlzLl9hc3NlcnRSaWdodCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHByZXBlbmQoYnVmZmVyOiBCdWZmZXIsIGVzc2VudGlhbDogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5fbGVmdCkge1xuICAgICAgaWYgKGVzc2VudGlhbCkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaW50cm8gPSB0aGlzLl9sZWZ0O1xuICAgIHRoaXMuX2xlZnQgPSBCdWZmZXIuYWxsb2MoaW50cm8ubGVuZ3RoICsgYnVmZmVyLmxlbmd0aCk7XG4gICAgaW50cm8uY29weSh0aGlzLl9sZWZ0LCAwKTtcbiAgICBidWZmZXIuY29weSh0aGlzLl9sZWZ0LCBpbnRyby5sZW5ndGgpO1xuXG4gICAgaWYgKGVzc2VudGlhbCkge1xuICAgICAgdGhpcy5fYXNzZXJ0TGVmdCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgYXNzZXJ0KGxlZnQ6IGJvb2xlYW4sIF9jb250ZW50OiBib29sZWFuLCByaWdodDogYm9vbGVhbikge1xuICAgIGlmIChsZWZ0KSB7XG4gICAgICBpZiAodGhpcy5fYXNzZXJ0TGVmdCkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmlnaHQpIHtcbiAgICAgIGlmICh0aGlzLl9hc3NlcnRSaWdodCkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlbW92ZShsZWZ0OiBib29sZWFuLCBjb250ZW50OiBib29sZWFuLCByaWdodDogYm9vbGVhbikge1xuICAgIGlmIChsZWZ0KSB7XG4gICAgICBpZiAodGhpcy5fYXNzZXJ0TGVmdCkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbGVmdCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChjb250ZW50KSB7XG4gICAgICB0aGlzLl9jb250ZW50ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHJpZ2h0KSB7XG4gICAgICBpZiAodGhpcy5fYXNzZXJ0UmlnaHQpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbnRlbnRDYW5ub3RCZVJlbW92ZWRFeGNlcHRpb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3JpZ2h0ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBjb3B5KHRhcmdldDogQnVmZmVyLCBzdGFydDogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX2xlZnQpIHtcbiAgICAgIHRoaXMuX2xlZnQuY29weSh0YXJnZXQsIHN0YXJ0KTtcbiAgICAgIHN0YXJ0ICs9IHRoaXMuX2xlZnQubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY29udGVudCkge1xuICAgICAgdGhpcy5fY29udGVudC5jb3B5KHRhcmdldCwgc3RhcnQpO1xuICAgICAgc3RhcnQgKz0gdGhpcy5fY29udGVudC5sZW5ndGg7XG4gICAgfVxuICAgIGlmICh0aGlzLl9yaWdodCkge1xuICAgICAgdGhpcy5fcmlnaHQuY29weSh0YXJnZXQsIHN0YXJ0KTtcbiAgICAgIHN0YXJ0ICs9IHRoaXMuX3JpZ2h0Lmxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhcnQ7XG4gIH1cbn1cblxuXG4vKipcbiAqIEFuIHV0aWxpdHkgY2xhc3MgdGhhdCBhbGxvd3MgYnVmZmVycyB0byBiZSBpbnNlcnRlZCB0byB0aGUgX3JpZ2h0IG9yIF9sZWZ0LCBvciBkZWxldGVkLCB3aGlsZVxuICoga2VlcGluZyBpbmRpY2VzIHRvIHRoZSBvcmlnaW5hbCBidWZmZXIuXG4gKlxuICogVGhlIGNvbnN0cnVjdG9yIHRha2VzIGFuIG9yaWdpbmFsIGJ1ZmZlciwgYW5kIGtlZXBzIGl0IGludG8gYSBsaW5rZWQgbGlzdCBvZiBjaHVua3MsIHNtYWxsZXJcbiAqIGJ1ZmZlcnMgdGhhdCBrZWVwIHRyYWNrIG9mIF9jb250ZW50IGluc2VydGVkIHRvIHRoZSBfcmlnaHQgb3IgX2xlZnQgb2YgaXQuXG4gKlxuICogU2luY2UgdGhlIE5vZGUgQnVmZmVyIHN0cnVjdHVyZSBpcyBub24tZGVzdHJ1Y3RpdmUgd2hlbiBzbGljaW5nLCB3ZSB0cnkgdG8gdXNlIHNsaWNpbmcgdG8gY3JlYXRlXG4gKiBuZXcgY2h1bmtzLCBhbmQgYWx3YXlzIGtlZXAgY2h1bmtzIHBvaW50aW5nIHRvIHRoZSBvcmlnaW5hbCBjb250ZW50LlxuICovXG5leHBvcnQgY2xhc3MgVXBkYXRlQnVmZmVyIHtcbiAgcHJvdGVjdGVkIF9saW5rZWRMaXN0OiBMaW5rZWRMaXN0PENodW5rPjtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX29yaWdpbmFsQ29udGVudDogQnVmZmVyKSB7XG4gICAgdGhpcy5fbGlua2VkTGlzdCA9IG5ldyBMaW5rZWRMaXN0KG5ldyBDaHVuaygwLCBfb3JpZ2luYWxDb250ZW50Lmxlbmd0aCwgX29yaWdpbmFsQ29udGVudCkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9hc3NlcnRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+IHRoaXMuX29yaWdpbmFsQ29udGVudC5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBJbmRleE91dE9mQm91bmRFeGNlcHRpb24oaW5kZXgsIDAsIHRoaXMuX29yaWdpbmFsQ29udGVudC5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBfc2xpY2Uoc3RhcnQ6IG51bWJlcik6IFtDaHVuaywgQ2h1bmtdIHtcbiAgICB0aGlzLl9hc3NlcnRJbmRleChzdGFydCk7XG5cbiAgICAvLyBGaW5kIHRoZSBjaHVuayBieSBnb2luZyB0aHJvdWdoIHRoZSBsaXN0LlxuICAgIGNvbnN0IGggPSB0aGlzLl9saW5rZWRMaXN0LmZpbmQoY2h1bmsgPT4gc3RhcnQgPD0gY2h1bmsuZW5kKTtcbiAgICBpZiAoIWgpIHtcbiAgICAgIHRocm93IEVycm9yKCdDaHVuayBjYW5ub3QgYmUgZm91bmQuJyk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID09IGguZW5kICYmIGgubmV4dCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtoLCBoLm5leHRdO1xuICAgIH1cblxuICAgIHJldHVybiBbaCwgaC5zbGljZShzdGFydCldO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9saW5rZWRMaXN0LnJlZHVjZSgoYWNjLCBjaHVuaykgPT4gYWNjICsgY2h1bmsubGVuZ3RoLCAwKTtcbiAgfVxuICBnZXQgb3JpZ2luYWwoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZ2luYWxDb250ZW50O1xuICB9XG5cbiAgdG9TdHJpbmcoZW5jb2RpbmcgPSAndXRmLTgnKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbGlua2VkTGlzdC5yZWR1Y2UoKGFjYywgY2h1bmspID0+IGFjYyArIGNodW5rLnRvU3RyaW5nKGVuY29kaW5nKSwgJycpO1xuICB9XG4gIGdlbmVyYXRlKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgcmVzdWx0ID0gQnVmZmVyLmFsbG9jVW5zYWZlKHRoaXMubGVuZ3RoKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgdGhpcy5fbGlua2VkTGlzdC5mb3JFYWNoKGNodW5rID0+IHtcbiAgICAgIGNodW5rLmNvcHkocmVzdWx0LCBpKTtcbiAgICAgIGkgKz0gY2h1bmsubGVuZ3RoO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGluc2VydExlZnQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyLCBhc3NlcnQgPSBmYWxzZSkge1xuICAgIHRoaXMuX3NsaWNlKGluZGV4KVswXS5hcHBlbmQoY29udGVudCwgYXNzZXJ0KTtcbiAgfVxuICBpbnNlcnRSaWdodChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIsIGFzc2VydCA9IGZhbHNlKSB7XG4gICAgdGhpcy5fc2xpY2UoaW5kZXgpWzFdLnByZXBlbmQoY29udGVudCwgYXNzZXJ0KTtcbiAgfVxuXG4gIHJlbW92ZShpbmRleDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikge1xuICAgIGNvbnN0IGVuZCA9IGluZGV4ICsgbGVuZ3RoO1xuXG4gICAgY29uc3QgZmlyc3QgPSB0aGlzLl9zbGljZShpbmRleClbMV07XG4gICAgY29uc3QgbGFzdCA9IHRoaXMuX3NsaWNlKGVuZClbMV07XG5cbiAgICBsZXQgY3VycjogQ2h1bmsgfCBudWxsO1xuICAgIGZvciAoY3VyciA9IGZpcnN0OyBjdXJyICYmIGN1cnIgIT09IGxhc3Q7IGN1cnIgPSBjdXJyLm5leHQpIHtcbiAgICAgIGN1cnIuYXNzZXJ0KGN1cnIgIT09IGZpcnN0LCBjdXJyICE9PSBsYXN0LCBjdXJyID09PSBmaXJzdCk7XG4gICAgfVxuICAgIGZvciAoY3VyciA9IGZpcnN0OyBjdXJyICYmIGN1cnIgIT09IGxhc3Q7IGN1cnIgPSBjdXJyLm5leHQpIHtcbiAgICAgIGN1cnIucmVtb3ZlKGN1cnIgIT09IGZpcnN0LCBjdXJyICE9PSBsYXN0LCBjdXJyID09PSBmaXJzdCk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnIpIHtcbiAgICAgIGN1cnIucmVtb3ZlKHRydWUsIGZhbHNlLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iXX0=