//this is used to import/export the savestates out of indexed db

export class DBExport {

    /**
     * Export all data from an IndexedDB database
     * @param {IDBDatabase} idbDatabase - to export from
     * @param {string} savefilename - name of save state key
     * @param {function(Object?, string?)} cb - callback with signature (error, jsonString)
     */
    exportToJsonString(idbDatabase:IDBDatabase,savefilename:string,cb:Function) {
        const exportObject = {};
        if (idbDatabase.objectStoreNames.length === 0) {
            cb(null, JSON.stringify(exportObject));
        } else {
            const transaction = idbDatabase.transaction(
                (idbDatabase.objectStoreNames as any),
                'readonly'
            );
            transaction.onerror = (event) => cb(event, null);

            Array.from(idbDatabase.objectStoreNames).forEach((storeName:string) => {
                const allObjects = [];
                transaction.objectStore(storeName).openCursor().onsuccess = (event) => {
                    const cursor = (event.target as any).result;
                    if (cursor) {
                        if (cursor.key==savefilename){
                            let cursorObject = {
                                key: cursor.key,
                                value: cursor.value
                            }
                            allObjects.push(cursorObject);
                        }
                        cursor.continue();
                    } else {
                        exportObject[storeName] = allObjects;
                        if (
                            idbDatabase.objectStoreNames.length ===
                            Object.keys(exportObject).length
                        ) {
                            cb(null, JSON.stringify(exportObject));
                        }
                    }

                    
                };
            });
        }
    }

    /**
     * Import data from JSON into an IndexedDB database. This does not delete any existing data
     *  from the database, so keys could clash
     *
     * @param {IDBDatabase} idbDatabase - to import into
     * @param {string} jsonString - data to import, one key per object store
     * @param {function(Object)} cb - callback with signature (error), where error is null on success
     */
    importFromJsonString(idbDatabase:IDBDatabase, jsonString:string, cb:Function) {
        const transaction = idbDatabase.transaction(
            (idbDatabase.objectStoreNames as any),
            'readwrite'
        );
        transaction.onerror = (event) => cb(event);

        const importObject = JSON.parse(jsonString);
        Array.from(idbDatabase.objectStoreNames).forEach((storeName:string) => {
            let count = 0;
            Array.from(importObject[storeName]).forEach((toAdd:any) => {
                this.convertSavestateObject(toAdd.value);
                const request = transaction.objectStore(storeName).put(toAdd.value,toAdd.key);
                request.onsuccess = () => {
                    count++;
                    if (count === importObject[storeName].length) {
                        // added all objects for this store
                        delete importObject[storeName];
                        if (Object.keys(importObject).length === 0) {
                            // added all object stores
                            cb(null);
                        }
                    }
                };
                request.onerror = (error) =>{
                    console.log('error adding to store');
                }
            });
        });
    }

    //this is needed because after JSON.parse
    //the UInt8Array's are just number arrays
    convertSavestateObject(objectToConvert:any){
        this.convertToUIntArray(objectToConvert,'chrData');
        this.convertToUIntArray(objectToConvert,'oam');
        this.convertToUIntArray(objectToConvert,'ram');
        this.convertToUIntArray(objectToConvert,'saveRam');
        this.convertToUIntArray(objectToConvert,'vram');
    }

    convertToUIntArray(objectToConvert:any,key:string){
        let filedata = objectToConvert[key] as [];
        let keylength = Object.keys(filedata).length;
        let filedatanums = new Uint8Array(keylength);
        for(let i=0;i<keylength;i++){
            filedatanums[i] = parseInt(filedata[i]);
        }
        objectToConvert[key] = filedatanums;
    }

    /**
     * Clears a database of all data
     *
     * @param {IDBDatabase} idbDatabase - to delete all data from
     * @param {function(Object)} cb - callback with signature (error), where error is null on success
     */
    clearDatabase(idbDatabase:IDBDatabase, cb:Function) {
        const transaction = idbDatabase.transaction(
            (idbDatabase.objectStoreNames as any),
            'readwrite'
        );
        transaction.onerror = (event) => cb(event);

        let count = 0;
        Array.from(idbDatabase.objectStoreNames).forEach(function (storeName) {
            transaction.objectStore(storeName).clear().onsuccess = () => {
                count++;
                if (count === idbDatabase.objectStoreNames.length) {
                    // cleared all object stores
                    cb(null);
                }
            };
        });
    }
}