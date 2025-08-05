import sys
import json
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
import numpy as np

# Получаем данные из Node.js
data = json.loads(sys.argv[1])
df = pd.DataFrame(data)

# Преобразуем категории в числовые значения
preprocessor = ColumnTransformer(
    transformers=[('cat', OneHotEncoder(), ['category'])],
    remainder='passthrough'
)

X = preprocessor.fit_transform(df[['category', 'current_month']])
y = df['sales_3months'].values

# Обучаем модель
model = LinearRegression()
model.fit(X, y)

# Прогнозируем продажи
predictions = model.predict(X)

# Формируем рекомендации
results = []
for idx, row in df.iterrows():
    current_stock = row['current_stock'] or 0
    predicted_sales = predictions[idx]
    
    # Рассчитываем рекомендуемое количество для заказа
    safety_stock = predicted_sales * 1.5  # Буферный запас
    recommended = max(0, safety_stock - current_stock)
    
    # Определяем срочность
    if current_stock < predicted_sales * 0.5:
        urgency = 'high'
    elif current_stock < predicted_sales:
        urgency = 'medium'
    else:
        urgency = 'low'
    
    results.append({
        'product_id': row['product_id'],
        'product_name': row['product_name'],
        'current_stock': current_stock,
        'predicted_sales': round(predicted_sales, 2),
        'recommended_quantity': round(recommended),
        'urgency': urgency
    })

# Возвращаем результаты в Node.js
print(json.dumps(results))