import styles from './Header.module.css';

interface HeaderProps {
  titulo: string;
  onVolver?: () => void;
}

export function Header({ titulo, onVolver }: HeaderProps) {
  return (
    <header className={styles.header}>
      {onVolver && (
        <button type="button" className={styles.botonVolver} onClick={onVolver} aria-label="Volver">
          ←
        </button>
      )}
      <h1 className={styles.titulo}>{titulo}</h1>
    </header>
  );
}
