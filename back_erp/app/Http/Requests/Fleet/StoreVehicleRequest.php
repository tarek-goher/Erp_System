<?php

namespace App\Http\Requests\Fleet;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('vehicle')?->id;

        return [
            'name'            => 'required|string|max:150',
            'plate_number'    => 'required|string|max:20|unique:vehicles,plate_number,' . $id,
            'type'            => 'nullable|in:car,truck,van,motorcycle,bus',
            'make'            => 'nullable|string|max:100',
            'model'           => 'nullable|string|max:100',
            'year'            => 'nullable|integer|min:1990|max:' . (date('Y') + 1),
            'color'           => 'nullable|string|max:50',
            'fuel_type'       => 'nullable|in:petrol,diesel,electric,hybrid',
            'status'          => 'nullable|in:active,maintenance,retired',
            'assigned_driver' => 'nullable|string|max:150',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'اسم المركبة مطلوب.',
            'plate_number.required'   => 'رقم اللوحة مطلوب.',
            'plate_number.unique'     => 'رقم اللوحة مستخدم بالفعل.',
        ];
    }
}
