#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
const json_schema_1 = require("@ngtools/json-schema");
const minimist = require("minimist");
const Observable_1 = require("rxjs/Observable");
require("rxjs/add/operator/ignoreElements");
/**
 * Show usage of the CLI tool, and exit the process.
 */
function usage(exitCode = 0) {
    logger.info(`
    schematics [CollectionName:]SchematicName [options, ...]

    By default, if the collection name is not specified, use the internal collection provided
    by the Schematics CLI.

    Options:
        --dry-run           Do not output anything, but instead just show what actions would be
                            performed.
        --force             Force overwriting files that would otherwise be an error.
        --list-schematics   List all schematics from the collection, by name.
        --help              Show this message.

    Any additional option is passed to the Schematics depending on
  `.replace(/^\s\s\s\s/g, '')); // To remove the indentation.
    process.exit(exitCode);
    throw 0; // The node typing sometimes don't have a never type for process.exit().
}
/**
 * Parse the name of schematic passed in argument, and return a {collection, schematic} named
 * tuple. The user can pass in `collection-name:schematic-name`, and this function will either
 * return `{collection: 'collection-name', schematic: 'schematic-name'}`, or it will error out
 * and show usage.
 *
 * In the case where a collection name isn't part of the argument, the default is to use this
 * package (@schematics/angular) as the collection.
 *
 * This logic is entirely up to the tooling.
 *
 * @param str The argument to parse.
 * @return {{collection: string, schematic: (string)}}
 */
function parseSchematicName(str) {
    let collection = '@schematics/angular';
    if (!str || str === null) {
        usage(1);
    }
    let schematic = str;
    if (schematic.indexOf(':') != -1) {
        [collection, schematic] = schematic.split(':', 2);
        if (!schematic) {
            usage(2);
        }
    }
    return { collection, schematic };
}
/** Parse the command line. */
const argv = minimist(process.argv.slice(2), {
    boolean: ['dry-run', 'force', 'help', 'list-schematics', 'verbose'],
});
/** Create the DevKit Logger used through the CLI. */
const logger = core_1.createLogger(argv['verbose']);
if (argv.help) {
    usage();
}
/** Get the collection an schematic name from the first argument. */
const { collection: collectionName, schematic: schematicName, } = parseSchematicName(argv._.shift() || null);
/**
 * Create the SchematicEngine, which is used by the Schematic library as callbacks to load a
 * Collection or a Schematic.
 */
const engineHost = new tools_1.NodeModulesEngineHost();
const engine = new schematics_1.SchematicEngine(engineHost);
// Add support for schemaJson.
engineHost.registerOptionsTransform((schematic, options) => {
    if (schematic.schema && schematic.schemaJson) {
        const SchemaMetaClass = json_schema_1.SchemaClassFactory(schematic.schemaJson);
        const schemaClass = new SchemaMetaClass(options);
        return schemaClass.$$root();
    }
    return options;
});
/**
 * The collection to be used.
 * @type {Collection|any}
 */
const collection = engine.createCollection(collectionName);
if (collection === null) {
    logger.fatal(`Invalid collection name: "${collectionName}".`);
    process.exit(3);
    throw 3; // TypeScript doesn't know that process.exit() never returns.
}
/** If the user wants to list schematics, we simply show all the schematic names. */
if (argv['list-schematics']) {
    logger.info(engineHost.listSchematics(collection).join('\n'));
    process.exit(0);
    throw 0; // TypeScript doesn't know that process.exit() never returns.
}
/** Create the schematic from the collection. */
const schematic = collection.createSchematic(schematicName);
/** Gather the arguments for later use. */
const force = argv['force'];
const dryRun = argv['dry-run'];
/** This host is the original Tree created from the current directory. */
const host = Observable_1.Observable.of(new schematics_1.FileSystemTree(new tools_1.FileSystemHost(process.cwd())));
// We need two sinks if we want to output what will happen, and actually do the work.
// Note that fsSink is technically not used if `--dry-run` is passed, but creating the Sink
// does not have any side effect.
const dryRunSink = new schematics_1.DryRunSink(process.cwd(), force);
const fsSink = new schematics_1.FileSystemSink(process.cwd(), force);
// We keep a boolean to tell us whether an error would occur if we were to commit to an
// actual filesystem. In this case we simply show the dry-run, but skip the fsSink commit.
let error = false;
const loggingQueue = [];
// Logs out dry run events.
dryRunSink.reporter.subscribe((event) => {
    switch (event.kind) {
        case 'error':
            const desc = event.description == 'alreadyExist' ? 'already exists' : 'does not exist.';
            logger.warn(`ERROR! ${event.path} ${desc}.`);
            error = true;
            break;
        case 'update':
            loggingQueue.push(`UPDATE ${event.path} (${event.content.length} bytes)`);
            break;
        case 'create':
            loggingQueue.push(`CREATE ${event.path} (${event.content.length} bytes)`);
            break;
        case 'delete':
            loggingQueue.push(`DELETE ${event.path}`);
            break;
        case 'rename':
            loggingQueue.push(`RENAME ${event.path} => ${event.to}`);
            break;
    }
});
/**
 * The main path. Call the schematic with the host. This creates a new Context for the schematic
 * to run in, then call the schematic rule using the input Tree. This returns a new Tree as if
 * the schematic was applied to it.
 *
 * We then optimize this tree. This removes any duplicated actions or actions that would result
 * in a noop (for example, creating then deleting a file). This is not necessary but will greatly
 * improve performance as hitting the file system is costly.
 *
 * Then we proceed to run the dryRun commit. We run this before we then commit to the filesystem
 * (if --dry-run was not passed or an error was detected by dryRun).
 */
schematic.call(argv, host)
    .map((tree) => schematics_1.Tree.optimize(tree))
    .concatMap((tree) => {
    return dryRunSink.commit(tree).ignoreElements().concat(Observable_1.Observable.of(tree));
})
    .concatMap((tree) => {
    if (!error) {
        // Output the logging queue.
        loggingQueue.forEach(log => logger.info(log));
    }
    if (dryRun || error) {
        return Observable_1.Observable.of(tree);
    }
    return fsSink.commit(tree).ignoreElements().concat(Observable_1.Observable.of(tree));
})
    .subscribe({
    error(err) {
        logger.fatal(err.toString());
        process.exit(1);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljcy5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvaGFuc2wvU291cmNlcy9kZXZraXQvIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL2Jpbi9zY2hlbWF0aWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVFBLCtDQUFvRDtBQUNwRCwyREFPb0M7QUFDcEMsNERBSTBDO0FBQzFDLHNEQUEwRDtBQUMxRCxxQ0FBcUM7QUFDckMsZ0RBQTZDO0FBQzdDLDRDQUEwQztBQUcxQzs7R0FFRztBQUNILGVBQWUsUUFBUSxHQUFHLENBQUM7SUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7R0FjWCxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLDZCQUE2QjtJQUU1RCxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZCLE1BQU0sQ0FBQyxDQUFDLENBQUUsd0VBQXdFO0FBQ3BGLENBQUM7QUFHRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsNEJBQTRCLEdBQWtCO0lBQzVDLElBQUksVUFBVSxHQUFHLHFCQUFxQixDQUFDO0lBRXZDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxJQUFJLFNBQVMsR0FBVyxHQUFhLENBQUM7SUFDdEMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFbEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUM7QUFDbkMsQ0FBQztBQUdELDhCQUE4QjtBQUM5QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDM0MsT0FBTyxFQUFFLENBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxDQUFFO0NBQ3RFLENBQUMsQ0FBQztBQUNILHFEQUFxRDtBQUNyRCxNQUFNLE1BQU0sR0FBRyxtQkFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBRTdDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2QsS0FBSyxFQUFFLENBQUM7QUFDVixDQUFDO0FBRUQsb0VBQW9FO0FBQ3BFLE1BQU0sRUFDSixVQUFVLEVBQUUsY0FBYyxFQUMxQixTQUFTLEVBQUUsYUFBYSxHQUN6QixHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLENBQUM7QUFHL0M7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSw2QkFBcUIsRUFBRSxDQUFDO0FBQy9DLE1BQU0sTUFBTSxHQUFHLElBQUksNEJBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUUvQyw4QkFBOEI7QUFDOUIsVUFBVSxDQUFDLHdCQUF3QixDQUFDLENBQUMsU0FBa0MsRUFBRSxPQUFXO0lBQ2xGLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxlQUFlLEdBQUcsZ0NBQWtCLENBQUssU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sV0FBVyxHQUFHLElBQUksZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWpELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUM7QUFHSDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDM0QsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsY0FBYyxJQUFJLENBQUMsQ0FBQztJQUM5RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hCLE1BQU0sQ0FBQyxDQUFDLENBQUUsNkRBQTZEO0FBQ3pFLENBQUM7QUFHRCxvRkFBb0Y7QUFDcEYsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hCLE1BQU0sQ0FBQyxDQUFDLENBQUUsNkRBQTZEO0FBQ3pFLENBQUM7QUFHRCxnREFBZ0Q7QUFDaEQsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUU1RCwwQ0FBMEM7QUFDMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzVCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUUvQix5RUFBeUU7QUFDekUsTUFBTSxJQUFJLEdBQUcsdUJBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSwyQkFBYyxDQUFDLElBQUksc0JBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFbEYscUZBQXFGO0FBQ3JGLDJGQUEyRjtBQUMzRixpQ0FBaUM7QUFDakMsTUFBTSxVQUFVLEdBQUcsSUFBSSx1QkFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4RCxNQUFNLE1BQU0sR0FBRyxJQUFJLDJCQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBR3hELHVGQUF1RjtBQUN2RiwwRkFBMEY7QUFDMUYsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBR2xCLE1BQU0sWUFBWSxHQUFhLEVBQUUsQ0FBQztBQUVsQywyQkFBMkI7QUFDM0IsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFrQjtJQUMvQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuQixLQUFLLE9BQU87WUFDVixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLGNBQWMsR0FBRyxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQztZQUN4RixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDYixLQUFLLENBQUM7UUFDUixLQUFLLFFBQVE7WUFDWCxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sU0FBUyxDQUFDLENBQUM7WUFDMUUsS0FBSyxDQUFDO1FBQ1IsS0FBSyxRQUFRO1lBQ1gsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLFNBQVMsQ0FBQyxDQUFDO1lBQzFFLEtBQUssQ0FBQztRQUNSLEtBQUssUUFBUTtZQUNYLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxQyxLQUFLLENBQUM7UUFDUixLQUFLLFFBQVE7WUFDWCxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLElBQUksT0FBTyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6RCxLQUFLLENBQUM7SUFDVixDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFHSDs7Ozs7Ozs7Ozs7R0FXRztBQUNILFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztLQUN2QixHQUFHLENBQUMsQ0FBQyxJQUFVLEtBQUssaUJBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEMsU0FBUyxDQUFDLENBQUMsSUFBVTtJQUNwQixNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsdUJBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUM7S0FDRCxTQUFTLENBQUMsQ0FBQyxJQUFVO0lBQ3BCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNYLDRCQUE0QjtRQUM1QixZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyx1QkFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLHVCQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQyxDQUFDO0tBQ0QsU0FBUyxDQUFDO0lBQ1QsS0FBSyxDQUFDLEdBQVU7UUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IGNyZWF0ZUxvZ2dlciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIERyeVJ1bkV2ZW50LFxuICBEcnlSdW5TaW5rLFxuICBGaWxlU3lzdGVtU2luayxcbiAgRmlsZVN5c3RlbVRyZWUsXG4gIFNjaGVtYXRpY0VuZ2luZSxcbiAgVHJlZSxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtcbiAgRmlsZVN5c3RlbUhvc3QsXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLFxuICBOb2RlTW9kdWxlc0VuZ2luZUhvc3QsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rvb2xzJztcbmltcG9ydCB7IFNjaGVtYUNsYXNzRmFjdG9yeSB9IGZyb20gJ0BuZ3Rvb2xzL2pzb24tc2NoZW1hJztcbmltcG9ydCAqIGFzIG1pbmltaXN0IGZyb20gJ21pbmltaXN0JztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuaW1wb3J0ICdyeGpzL2FkZC9vcGVyYXRvci9pZ25vcmVFbGVtZW50cyc7XG5cblxuLyoqXG4gKiBTaG93IHVzYWdlIG9mIHRoZSBDTEkgdG9vbCwgYW5kIGV4aXQgdGhlIHByb2Nlc3MuXG4gKi9cbmZ1bmN0aW9uIHVzYWdlKGV4aXRDb2RlID0gMCk6IG5ldmVyIHtcbiAgbG9nZ2VyLmluZm8oYFxuICAgIHNjaGVtYXRpY3MgW0NvbGxlY3Rpb25OYW1lOl1TY2hlbWF0aWNOYW1lIFtvcHRpb25zLCAuLi5dXG5cbiAgICBCeSBkZWZhdWx0LCBpZiB0aGUgY29sbGVjdGlvbiBuYW1lIGlzIG5vdCBzcGVjaWZpZWQsIHVzZSB0aGUgaW50ZXJuYWwgY29sbGVjdGlvbiBwcm92aWRlZFxuICAgIGJ5IHRoZSBTY2hlbWF0aWNzIENMSS5cblxuICAgIE9wdGlvbnM6XG4gICAgICAgIC0tZHJ5LXJ1biAgICAgICAgICAgRG8gbm90IG91dHB1dCBhbnl0aGluZywgYnV0IGluc3RlYWQganVzdCBzaG93IHdoYXQgYWN0aW9ucyB3b3VsZCBiZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm1lZC5cbiAgICAgICAgLS1mb3JjZSAgICAgICAgICAgICBGb3JjZSBvdmVyd3JpdGluZyBmaWxlcyB0aGF0IHdvdWxkIG90aGVyd2lzZSBiZSBhbiBlcnJvci5cbiAgICAgICAgLS1saXN0LXNjaGVtYXRpY3MgICBMaXN0IGFsbCBzY2hlbWF0aWNzIGZyb20gdGhlIGNvbGxlY3Rpb24sIGJ5IG5hbWUuXG4gICAgICAgIC0taGVscCAgICAgICAgICAgICAgU2hvdyB0aGlzIG1lc3NhZ2UuXG5cbiAgICBBbnkgYWRkaXRpb25hbCBvcHRpb24gaXMgcGFzc2VkIHRvIHRoZSBTY2hlbWF0aWNzIGRlcGVuZGluZyBvblxuICBgLnJlcGxhY2UoL15cXHNcXHNcXHNcXHMvZywgJycpKTsgIC8vIFRvIHJlbW92ZSB0aGUgaW5kZW50YXRpb24uXG5cbiAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgdGhyb3cgMDsgIC8vIFRoZSBub2RlIHR5cGluZyBzb21ldGltZXMgZG9uJ3QgaGF2ZSBhIG5ldmVyIHR5cGUgZm9yIHByb2Nlc3MuZXhpdCgpLlxufVxuXG5cbi8qKlxuICogUGFyc2UgdGhlIG5hbWUgb2Ygc2NoZW1hdGljIHBhc3NlZCBpbiBhcmd1bWVudCwgYW5kIHJldHVybiBhIHtjb2xsZWN0aW9uLCBzY2hlbWF0aWN9IG5hbWVkXG4gKiB0dXBsZS4gVGhlIHVzZXIgY2FuIHBhc3MgaW4gYGNvbGxlY3Rpb24tbmFtZTpzY2hlbWF0aWMtbmFtZWAsIGFuZCB0aGlzIGZ1bmN0aW9uIHdpbGwgZWl0aGVyXG4gKiByZXR1cm4gYHtjb2xsZWN0aW9uOiAnY29sbGVjdGlvbi1uYW1lJywgc2NoZW1hdGljOiAnc2NoZW1hdGljLW5hbWUnfWAsIG9yIGl0IHdpbGwgZXJyb3Igb3V0XG4gKiBhbmQgc2hvdyB1c2FnZS5cbiAqXG4gKiBJbiB0aGUgY2FzZSB3aGVyZSBhIGNvbGxlY3Rpb24gbmFtZSBpc24ndCBwYXJ0IG9mIHRoZSBhcmd1bWVudCwgdGhlIGRlZmF1bHQgaXMgdG8gdXNlIHRoaXNcbiAqIHBhY2thZ2UgKEBzY2hlbWF0aWNzL2FuZ3VsYXIpIGFzIHRoZSBjb2xsZWN0aW9uLlxuICpcbiAqIFRoaXMgbG9naWMgaXMgZW50aXJlbHkgdXAgdG8gdGhlIHRvb2xpbmcuXG4gKlxuICogQHBhcmFtIHN0ciBUaGUgYXJndW1lbnQgdG8gcGFyc2UuXG4gKiBAcmV0dXJuIHt7Y29sbGVjdGlvbjogc3RyaW5nLCBzY2hlbWF0aWM6IChzdHJpbmcpfX1cbiAqL1xuZnVuY3Rpb24gcGFyc2VTY2hlbWF0aWNOYW1lKHN0cjogc3RyaW5nIHwgbnVsbCk6IHsgY29sbGVjdGlvbjogc3RyaW5nLCBzY2hlbWF0aWM6IHN0cmluZyB9IHtcbiAgbGV0IGNvbGxlY3Rpb24gPSAnQHNjaGVtYXRpY3MvYW5ndWxhcic7XG5cbiAgaWYgKCFzdHIgfHwgc3RyID09PSBudWxsKSB7XG4gICAgdXNhZ2UoMSk7XG4gIH1cblxuICBsZXQgc2NoZW1hdGljOiBzdHJpbmcgPSBzdHIgYXMgc3RyaW5nO1xuICBpZiAoc2NoZW1hdGljLmluZGV4T2YoJzonKSAhPSAtMSkge1xuICAgIFtjb2xsZWN0aW9uLCBzY2hlbWF0aWNdID0gc2NoZW1hdGljLnNwbGl0KCc6JywgMik7XG5cbiAgICBpZiAoIXNjaGVtYXRpYykge1xuICAgICAgdXNhZ2UoMik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgY29sbGVjdGlvbiwgc2NoZW1hdGljIH07XG59XG5cblxuLyoqIFBhcnNlIHRoZSBjb21tYW5kIGxpbmUuICovXG5jb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpLCB7XG4gIGJvb2xlYW46IFsgJ2RyeS1ydW4nLCAnZm9yY2UnLCAnaGVscCcsICdsaXN0LXNjaGVtYXRpY3MnLCAndmVyYm9zZScgXSxcbn0pO1xuLyoqIENyZWF0ZSB0aGUgRGV2S2l0IExvZ2dlciB1c2VkIHRocm91Z2ggdGhlIENMSS4gKi9cbmNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcihhcmd2Wyd2ZXJib3NlJ10pO1xuXG5pZiAoYXJndi5oZWxwKSB7XG4gIHVzYWdlKCk7XG59XG5cbi8qKiBHZXQgdGhlIGNvbGxlY3Rpb24gYW4gc2NoZW1hdGljIG5hbWUgZnJvbSB0aGUgZmlyc3QgYXJndW1lbnQuICovXG5jb25zdCB7XG4gIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLFxuICBzY2hlbWF0aWM6IHNjaGVtYXRpY05hbWUsXG59ID0gcGFyc2VTY2hlbWF0aWNOYW1lKGFyZ3YuXy5zaGlmdCgpIHx8IG51bGwpO1xuXG5cbi8qKlxuICogQ3JlYXRlIHRoZSBTY2hlbWF0aWNFbmdpbmUsIHdoaWNoIGlzIHVzZWQgYnkgdGhlIFNjaGVtYXRpYyBsaWJyYXJ5IGFzIGNhbGxiYWNrcyB0byBsb2FkIGFcbiAqIENvbGxlY3Rpb24gb3IgYSBTY2hlbWF0aWMuXG4gKi9cbmNvbnN0IGVuZ2luZUhvc3QgPSBuZXcgTm9kZU1vZHVsZXNFbmdpbmVIb3N0KCk7XG5jb25zdCBlbmdpbmUgPSBuZXcgU2NoZW1hdGljRW5naW5lKGVuZ2luZUhvc3QpO1xuXG4vLyBBZGQgc3VwcG9ydCBmb3Igc2NoZW1hSnNvbi5cbmVuZ2luZUhvc3QucmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtKChzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjLCBvcHRpb25zOiB7fSkgPT4ge1xuICBpZiAoc2NoZW1hdGljLnNjaGVtYSAmJiBzY2hlbWF0aWMuc2NoZW1hSnNvbikge1xuICAgIGNvbnN0IFNjaGVtYU1ldGFDbGFzcyA9IFNjaGVtYUNsYXNzRmFjdG9yeTx7fT4oc2NoZW1hdGljLnNjaGVtYUpzb24pO1xuICAgIGNvbnN0IHNjaGVtYUNsYXNzID0gbmV3IFNjaGVtYU1ldGFDbGFzcyhvcHRpb25zKTtcblxuICAgIHJldHVybiBzY2hlbWFDbGFzcy4kJHJvb3QoKTtcbiAgfVxuXG4gIHJldHVybiBvcHRpb25zO1xufSk7XG5cblxuLyoqXG4gKiBUaGUgY29sbGVjdGlvbiB0byBiZSB1c2VkLlxuICogQHR5cGUge0NvbGxlY3Rpb258YW55fVxuICovXG5jb25zdCBjb2xsZWN0aW9uID0gZW5naW5lLmNyZWF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUpO1xuaWYgKGNvbGxlY3Rpb24gPT09IG51bGwpIHtcbiAgbG9nZ2VyLmZhdGFsKGBJbnZhbGlkIGNvbGxlY3Rpb24gbmFtZTogXCIke2NvbGxlY3Rpb25OYW1lfVwiLmApO1xuICBwcm9jZXNzLmV4aXQoMyk7XG4gIHRocm93IDM7ICAvLyBUeXBlU2NyaXB0IGRvZXNuJ3Qga25vdyB0aGF0IHByb2Nlc3MuZXhpdCgpIG5ldmVyIHJldHVybnMuXG59XG5cblxuLyoqIElmIHRoZSB1c2VyIHdhbnRzIHRvIGxpc3Qgc2NoZW1hdGljcywgd2Ugc2ltcGx5IHNob3cgYWxsIHRoZSBzY2hlbWF0aWMgbmFtZXMuICovXG5pZiAoYXJndlsnbGlzdC1zY2hlbWF0aWNzJ10pIHtcbiAgbG9nZ2VyLmluZm8oZW5naW5lSG9zdC5saXN0U2NoZW1hdGljcyhjb2xsZWN0aW9uKS5qb2luKCdcXG4nKSk7XG4gIHByb2Nlc3MuZXhpdCgwKTtcbiAgdGhyb3cgMDsgIC8vIFR5cGVTY3JpcHQgZG9lc24ndCBrbm93IHRoYXQgcHJvY2Vzcy5leGl0KCkgbmV2ZXIgcmV0dXJucy5cbn1cblxuXG4vKiogQ3JlYXRlIHRoZSBzY2hlbWF0aWMgZnJvbSB0aGUgY29sbGVjdGlvbi4gKi9cbmNvbnN0IHNjaGVtYXRpYyA9IGNvbGxlY3Rpb24uY3JlYXRlU2NoZW1hdGljKHNjaGVtYXRpY05hbWUpO1xuXG4vKiogR2F0aGVyIHRoZSBhcmd1bWVudHMgZm9yIGxhdGVyIHVzZS4gKi9cbmNvbnN0IGZvcmNlID0gYXJndlsnZm9yY2UnXTtcbmNvbnN0IGRyeVJ1biA9IGFyZ3ZbJ2RyeS1ydW4nXTtcblxuLyoqIFRoaXMgaG9zdCBpcyB0aGUgb3JpZ2luYWwgVHJlZSBjcmVhdGVkIGZyb20gdGhlIGN1cnJlbnQgZGlyZWN0b3J5LiAqL1xuY29uc3QgaG9zdCA9IE9ic2VydmFibGUub2YobmV3IEZpbGVTeXN0ZW1UcmVlKG5ldyBGaWxlU3lzdGVtSG9zdChwcm9jZXNzLmN3ZCgpKSkpO1xuXG4vLyBXZSBuZWVkIHR3byBzaW5rcyBpZiB3ZSB3YW50IHRvIG91dHB1dCB3aGF0IHdpbGwgaGFwcGVuLCBhbmQgYWN0dWFsbHkgZG8gdGhlIHdvcmsuXG4vLyBOb3RlIHRoYXQgZnNTaW5rIGlzIHRlY2huaWNhbGx5IG5vdCB1c2VkIGlmIGAtLWRyeS1ydW5gIGlzIHBhc3NlZCwgYnV0IGNyZWF0aW5nIHRoZSBTaW5rXG4vLyBkb2VzIG5vdCBoYXZlIGFueSBzaWRlIGVmZmVjdC5cbmNvbnN0IGRyeVJ1blNpbmsgPSBuZXcgRHJ5UnVuU2luayhwcm9jZXNzLmN3ZCgpLCBmb3JjZSk7XG5jb25zdCBmc1NpbmsgPSBuZXcgRmlsZVN5c3RlbVNpbmsocHJvY2Vzcy5jd2QoKSwgZm9yY2UpO1xuXG5cbi8vIFdlIGtlZXAgYSBib29sZWFuIHRvIHRlbGwgdXMgd2hldGhlciBhbiBlcnJvciB3b3VsZCBvY2N1ciBpZiB3ZSB3ZXJlIHRvIGNvbW1pdCB0byBhblxuLy8gYWN0dWFsIGZpbGVzeXN0ZW0uIEluIHRoaXMgY2FzZSB3ZSBzaW1wbHkgc2hvdyB0aGUgZHJ5LXJ1biwgYnV0IHNraXAgdGhlIGZzU2luayBjb21taXQuXG5sZXQgZXJyb3IgPSBmYWxzZTtcblxuXG5jb25zdCBsb2dnaW5nUXVldWU6IHN0cmluZ1tdID0gW107XG5cbi8vIExvZ3Mgb3V0IGRyeSBydW4gZXZlbnRzLlxuZHJ5UnVuU2luay5yZXBvcnRlci5zdWJzY3JpYmUoKGV2ZW50OiBEcnlSdW5FdmVudCkgPT4ge1xuICBzd2l0Y2ggKGV2ZW50LmtpbmQpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICBjb25zdCBkZXNjID0gZXZlbnQuZGVzY3JpcHRpb24gPT0gJ2FscmVhZHlFeGlzdCcgPyAnYWxyZWFkeSBleGlzdHMnIDogJ2RvZXMgbm90IGV4aXN0Lic7XG4gICAgICBsb2dnZXIud2FybihgRVJST1IhICR7ZXZlbnQucGF0aH0gJHtkZXNjfS5gKTtcbiAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBsb2dnaW5nUXVldWUucHVzaChgVVBEQVRFICR7ZXZlbnQucGF0aH0gKCR7ZXZlbnQuY29udGVudC5sZW5ndGh9IGJ5dGVzKWApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgIGxvZ2dpbmdRdWV1ZS5wdXNoKGBDUkVBVEUgJHtldmVudC5wYXRofSAoJHtldmVudC5jb250ZW50Lmxlbmd0aH0gYnl0ZXMpYCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdkZWxldGUnOlxuICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2goYERFTEVURSAke2V2ZW50LnBhdGh9YCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZW5hbWUnOlxuICAgICAgbG9nZ2luZ1F1ZXVlLnB1c2goYFJFTkFNRSAke2V2ZW50LnBhdGh9ID0+ICR7ZXZlbnQudG99YCk7XG4gICAgICBicmVhaztcbiAgfVxufSk7XG5cblxuLyoqXG4gKiBUaGUgbWFpbiBwYXRoLiBDYWxsIHRoZSBzY2hlbWF0aWMgd2l0aCB0aGUgaG9zdC4gVGhpcyBjcmVhdGVzIGEgbmV3IENvbnRleHQgZm9yIHRoZSBzY2hlbWF0aWNcbiAqIHRvIHJ1biBpbiwgdGhlbiBjYWxsIHRoZSBzY2hlbWF0aWMgcnVsZSB1c2luZyB0aGUgaW5wdXQgVHJlZS4gVGhpcyByZXR1cm5zIGEgbmV3IFRyZWUgYXMgaWZcbiAqIHRoZSBzY2hlbWF0aWMgd2FzIGFwcGxpZWQgdG8gaXQuXG4gKlxuICogV2UgdGhlbiBvcHRpbWl6ZSB0aGlzIHRyZWUuIFRoaXMgcmVtb3ZlcyBhbnkgZHVwbGljYXRlZCBhY3Rpb25zIG9yIGFjdGlvbnMgdGhhdCB3b3VsZCByZXN1bHRcbiAqIGluIGEgbm9vcCAoZm9yIGV4YW1wbGUsIGNyZWF0aW5nIHRoZW4gZGVsZXRpbmcgYSBmaWxlKS4gVGhpcyBpcyBub3QgbmVjZXNzYXJ5IGJ1dCB3aWxsIGdyZWF0bHlcbiAqIGltcHJvdmUgcGVyZm9ybWFuY2UgYXMgaGl0dGluZyB0aGUgZmlsZSBzeXN0ZW0gaXMgY29zdGx5LlxuICpcbiAqIFRoZW4gd2UgcHJvY2VlZCB0byBydW4gdGhlIGRyeVJ1biBjb21taXQuIFdlIHJ1biB0aGlzIGJlZm9yZSB3ZSB0aGVuIGNvbW1pdCB0byB0aGUgZmlsZXN5c3RlbVxuICogKGlmIC0tZHJ5LXJ1biB3YXMgbm90IHBhc3NlZCBvciBhbiBlcnJvciB3YXMgZGV0ZWN0ZWQgYnkgZHJ5UnVuKS5cbiAqL1xuc2NoZW1hdGljLmNhbGwoYXJndiwgaG9zdClcbiAgLm1hcCgodHJlZTogVHJlZSkgPT4gVHJlZS5vcHRpbWl6ZSh0cmVlKSlcbiAgLmNvbmNhdE1hcCgodHJlZTogVHJlZSkgPT4ge1xuICAgIHJldHVybiBkcnlSdW5TaW5rLmNvbW1pdCh0cmVlKS5pZ25vcmVFbGVtZW50cygpLmNvbmNhdChPYnNlcnZhYmxlLm9mKHRyZWUpKTtcbiAgfSlcbiAgLmNvbmNhdE1hcCgodHJlZTogVHJlZSkgPT4ge1xuICAgIGlmICghZXJyb3IpIHtcbiAgICAgIC8vIE91dHB1dCB0aGUgbG9nZ2luZyBxdWV1ZS5cbiAgICAgIGxvZ2dpbmdRdWV1ZS5mb3JFYWNoKGxvZyA9PiBsb2dnZXIuaW5mbyhsb2cpKTtcbiAgICB9XG5cbiAgICBpZiAoZHJ5UnVuIHx8IGVycm9yKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZih0cmVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnNTaW5rLmNvbW1pdCh0cmVlKS5pZ25vcmVFbGVtZW50cygpLmNvbmNhdChPYnNlcnZhYmxlLm9mKHRyZWUpKTtcbiAgfSlcbiAgLnN1YnNjcmliZSh7XG4gICAgZXJyb3IoZXJyOiBFcnJvcikge1xuICAgICAgbG9nZ2VyLmZhdGFsKGVyci50b1N0cmluZygpKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9LFxuICB9KTtcbiJdfQ==