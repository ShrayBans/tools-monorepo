import Papa from "papaparse"

export const parseCsv = <T>(file): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results: any) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
