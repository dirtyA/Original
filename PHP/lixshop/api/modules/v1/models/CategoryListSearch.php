<?php

namespace api\modules\v1\models;

use Yii;
use common\models\ProductCategory;
use yii\data\ActiveDataProvider;

class CategoryListSearch extends ProductCategory
{
    public function fields()
    {
        return [
            'product'
        ];
    }

    public function search($id)
    {
        // $query = ProductCategory::find()->where([
            // 'category_id' => $id 
        // ]);
        // $query->with('product');

        // $dataProvider = new ActiveDataProvider([
            // 'query' => $query,
        // ]);

        // return $dataProvider;
        $a = ProductCategory::findOne(18);
        return $a->product;
    }
}

