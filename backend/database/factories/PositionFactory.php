<?php

namespace Database\Factories;

use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

class PositionFactory extends Factory
{
    protected $model = Position::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->jobTitle(),
            'description' => $this->faker->sentence(10),
            'location' => $this->faker->randomElement(['On-site - Manila', 'Hybrid - Cebu', 'Remote']),
            'salary_min' => $this->faker->numberBetween(20000, 50000),
            'salary_max' => $this->faker->numberBetween(50001, 100000),
            'is_active' => $this->faker->boolean(90),
        ];
    }
}
