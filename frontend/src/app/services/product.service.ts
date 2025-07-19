import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, PricingMethod } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiBase}/products`;

  constructor(private http: HttpClient) { }

  // Obtener todos los productos activos
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // Obtener producto por ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Obtener producto por código
  getProductByCode(code: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/code/${code}`);
  }

  // Búsqueda de productos
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${query}`);
  }

  // Productos por categoría
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`);
  }

  // Productos con stock
  getProductsWithStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/with-stock`);
  }

  // Productos sin stock
  getProductsWithoutStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/without-stock`);
  }

  // Obtener categorías disponibles
  getAvailableCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  // Crear producto
  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  // Actualizar producto
  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  // Eliminar producto (desactivar)
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
