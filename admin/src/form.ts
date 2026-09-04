/** Copia staccata del contenuto prima di metterlo nel form: sono dati JSON, niente date o funzioni. */
export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** form.setFieldValue di Mantine, legato al contenuto che si sta modificando: il campo e il suo tipo devono corrispondere. */
export type FieldSetter<T> = <K extends keyof T & string>(key: K, value: T[K]) => void;
