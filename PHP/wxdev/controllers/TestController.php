<?php

namespace app\controllers;

use Yii;
use app\controllers\BaseController;

class TestController extends BaseController
{
    public function actionIndex()
    {
        return ['code' => 200];
    }

    /**
     * POST接口测试 直接输出传入参数
     *
     * @return void
     */
    public function actionPost()
    {
        if (Yii::$app->request->isPost) {
            $postData = Yii::$app->request->post();
            return $postData;
        } else {
            return ['methos' => 'get'];
        }
    }

    /**
     * 发送POST请求
     *
     * @return JSON
     */
    public function actionSend()
    {
        $url = 'http://192.168.0.102/code-repo/PHP/wxdev/web/wxapi/post';
        // $params = [
        //     'name' => 'Wsxxxx',
        // ];

        $params = [
            'button' => [
                [
                    'name' => 'button1',
                    'type' => 'click',
                    'key' => 'LIX_BUTTON1',
                ],
                [
                    'name' => 'button2',
                    'type' => 'click',
                    'key' => 'LIX_BUTTON2',
                ],
                [
                    'name' => 'button3',
                    'type' => 'click',
                    'key' => 'LIX_BUTTON3',
                ],
            ],
        ];
        
        // print_r(json_encode($params));
        // exit();

        $http = new HttpRequest();
        $data = $http->post($url, null, json_encode($params));
    }

}
