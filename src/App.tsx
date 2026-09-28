import { Navigate, Route, Routes } from 'react-router-dom';
import { ProductListPage } from './pages/ProductListPage/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage/ProductDetailPage';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/producto/:productoId" element={<ProductDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
