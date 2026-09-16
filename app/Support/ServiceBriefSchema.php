<?php

namespace App\Support;

use App\Models\ServiceBriefTemplate;

/**
 * Resolves a service's active brief template, merges in the shared
 * universal intake block (config/service_briefs.php) as the schema's first
 * step, and evaluates each field's `condition` against a flat answers map
 * so the same visibility rules apply consistently to server-side
 * validation, the admin display, and (mirrored client-side) the public
 * wizard.
 */
class ServiceBriefSchema
{
    public function activeTemplate(string $serviceSlug): ?ServiceBriefTemplate
    {
        return ServiceBriefTemplate::query()
            ->where('service_slug', $serviceSlug)
            ->where('is_active', true)
            ->latest('version')
            ->first();
    }

    /**
     * @return array<int, array{title: string, fields: array<int, array<string, mixed>>}>
     */
    public function steps(string $serviceSlug, ?ServiceBriefTemplate $template = null): array
    {
        $universalStep = [
            'title' => 'About you',
            'fields' => $this->resolveUniversalFields($serviceSlug),
        ];

        $serviceSteps = is_array($template?->steps) ? $template->steps : [];

        $normalizedServiceSteps = array_values(array_filter(
            array_map(static function (mixed $step): ?array {
                if (! is_array($step) || ! is_array($step['fields'] ?? null) || $step['fields'] === []) {
                    return null;
                }

                return [
                    'title' => (string) ($step['title'] ?? 'Details'),
                    'fields' => $step['fields'],
                ];
            }, $serviceSteps),
        ));

        return [$universalStep, ...$normalizedServiceSteps];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function flattenFields(array $steps): array
    {
        $fields = [];

        foreach ($steps as $step) {
            foreach ((array) ($step['fields'] ?? []) as $field) {
                if (is_array($field) && isset($field['key'])) {
                    $fields[] = $field;
                }
            }
        }

        return $fields;
    }

    /**
     * @param  array<string, mixed>  $answers
     * @return array<int, array<string, mixed>>
     */
    public function visibleFields(array $steps, array $answers): array
    {
        return array_values(array_filter(
            $this->flattenFields($steps),
            fn (array $field): bool => $this->isFieldVisible($field, $answers),
        ));
    }

    /**
     * @param  array<string, mixed>  $field
     * @param  array<string, mixed>  $answers
     */
    public function isFieldVisible(array $field, array $answers): bool
    {
        $condition = $field['condition'] ?? null;

        if (! is_array($condition)) {
            return true;
        }

        return $this->evaluateCondition($condition, $answers);
    }

    /**
     * @param  array<string, mixed>  $condition
     * @param  array<string, mixed>  $answers
     */
    public function evaluateCondition(array $condition, array $answers): bool
    {
        $field = (string) ($condition['field'] ?? '');
        $operator = (string) ($condition['operator'] ?? 'equals');
        $expected = $condition['value'] ?? null;
        $actual = $answers[$field] ?? null;

        return match ($operator) {
            'equals' => $this->looseEquals($actual, $expected),
            'not_equals' => ! $this->looseEquals($actual, $expected),
            'includes' => $this->includesAny((array) $actual, $expected),
            'not_includes' => ! $this->includesAny((array) $actual, $expected),
            'in' => $this->includesAny((array) $expected, $actual),
            default => true,
        };
    }

    /**
     * @return array<string, string>
     */
    public function labels(string $serviceSlug, ?ServiceBriefTemplate $template = null): array
    {
        $labels = [];

        foreach ($this->flattenFields($this->steps($serviceSlug, $template)) as $field) {
            $labels[(string) $field['key']] = (string) ($field['label'] ?? $field['key']);
        }

        return $labels;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolveUniversalFields(string $serviceSlug): array
    {
        $fields = (array) config('service_briefs.universal_fields', []);

        return array_map(function (array $field) use ($serviceSlug): array {
            if (($field['options_source'] ?? null) === 'per_service_budget_scale') {
                $field['options'] = (array) config("service_briefs.budget_scales.{$serviceSlug}", []);
            }

            return $field;
        }, $fields);
    }

    private function looseEquals(mixed $actual, mixed $expected): bool
    {
        if (is_array($actual)) {
            return $this->includesAny($actual, $expected);
        }

        return (string) $actual === (string) $expected;
    }

    /**
     * @param  array<int, mixed>  $haystack
     */
    private function includesAny(array $haystack, mixed $needleOrNeedles): bool
    {
        $needles = is_array($needleOrNeedles) ? $needleOrNeedles : [$needleOrNeedles];

        foreach ($needles as $needle) {
            if (in_array((string) $needle, array_map('strval', $haystack), true)) {
                return true;
            }
        }

        return false;
    }
}
