"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
const schematics_1 = require("@angular-devkit/schematics");
const stringUtils = require("../strings");
function default_1(options) {
    options.path = options.path ? schematics_1.normalizePath(options.path) : options.path;
    const sourceDir = options.sourceDir;
    if (!sourceDir) {
        throw new schematics_1.SchematicsError(`sourceDir option is required.`);
    }
    const templateSource = schematics_1.apply(schematics_1.url('./files'), [
        schematics_1.template(Object.assign({}, stringUtils, options)),
        schematics_1.move(sourceDir),
    ]);
    return schematics_1.chain([
        schematics_1.branchAndMerge(schematics_1.chain([
            schematics_1.mergeWith(templateSource),
        ])),
    ]);
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2hhbnNsL1NvdXJjZXMvZGV2a2l0LyIsInNvdXJjZXMiOlsicGFja2FnZXMvc2NoZW1hdGljcy9hbmd1bGFyL2VudW0vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0VBTUU7QUFDRiwyREFXb0M7QUFDcEMsMENBQTBDO0FBSTFDLG1CQUF5QixPQUFvQjtJQUMzQyxPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsMEJBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztJQUN6RSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ3BDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNmLE1BQU0sSUFBSSw0QkFBZSxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVELE1BQU0sY0FBYyxHQUFHLGtCQUFLLENBQUMsZ0JBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUMzQyxxQkFBUSxtQkFDSCxXQUFXLEVBQ1gsT0FBaUIsRUFDcEI7UUFDRixpQkFBSSxDQUFDLFNBQVMsQ0FBQztLQUNoQixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsa0JBQUssQ0FBQztRQUNYLDJCQUFjLENBQUMsa0JBQUssQ0FBQztZQUNuQixzQkFBUyxDQUFDLGNBQWMsQ0FBQztTQUMxQixDQUFDLENBQUM7S0FDSixDQUFDLENBQUM7QUFDTCxDQUFDO0FBcEJELDRCQW9CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFcnJvcixcbiAgYXBwbHksXG4gIGJyYW5jaEFuZE1lcmdlLFxuICBjaGFpbixcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICBub3JtYWxpemVQYXRoLFxuICB0ZW1wbGF0ZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgKiBhcyBzdHJpbmdVdGlscyBmcm9tICcuLi9zdHJpbmdzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBFbnVtT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogRW51bU9wdGlvbnMpOiBSdWxlIHtcbiAgb3B0aW9ucy5wYXRoID0gb3B0aW9ucy5wYXRoID8gbm9ybWFsaXplUGF0aChvcHRpb25zLnBhdGgpIDogb3B0aW9ucy5wYXRoO1xuICBjb25zdCBzb3VyY2VEaXIgPSBvcHRpb25zLnNvdXJjZURpcjtcbiAgaWYgKCFzb3VyY2VEaXIpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0Vycm9yKGBzb3VyY2VEaXIgb3B0aW9uIGlzIHJlcXVpcmVkLmApO1xuICB9XG5cbiAgY29uc3QgdGVtcGxhdGVTb3VyY2UgPSBhcHBseSh1cmwoJy4vZmlsZXMnKSwgW1xuICAgIHRlbXBsYXRlKHtcbiAgICAgIC4uLnN0cmluZ1V0aWxzLFxuICAgICAgLi4ub3B0aW9ucyBhcyBvYmplY3QsXG4gICAgfSksXG4gICAgbW92ZShzb3VyY2VEaXIpLFxuICBdKTtcblxuICByZXR1cm4gY2hhaW4oW1xuICAgIGJyYW5jaEFuZE1lcmdlKGNoYWluKFtcbiAgICAgIG1lcmdlV2l0aCh0ZW1wbGF0ZVNvdXJjZSksXG4gICAgXSkpLFxuICBdKTtcbn1cbiJdfQ==