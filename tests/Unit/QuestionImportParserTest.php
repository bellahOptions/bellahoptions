<?php

namespace Tests\Unit;

use App\Support\QuestionImportParser;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use RuntimeException;

class QuestionImportParserTest extends TestCase
{
    private function extractQuestionsFromLines(array $lines): array
    {
        $parser = new QuestionImportParser();
        $method = new ReflectionMethod($parser, 'extractQuestionsFromLines');
        $method->setAccessible(true);

        return $method->invoke($parser, $lines);
    }

    public function test_lines_ending_in_question_mark_become_text_questions(): void
    {
        $questions = $this->extractQuestionsFromLines([
            'Service Questionnaire',
            'What did you think of the final delivery?',
            'Any other comments?',
        ]);

        $this->assertCount(2, $questions);
        $this->assertSame('What did you think of the final delivery?', $questions[0]['label']);
        $this->assertSame('text', $questions[0]['type']);
        $this->assertSame('Any other comments?', $questions[1]['label']);
        $this->assertSame('text', $questions[1]['type']);
    }

    public function test_rating_phrasing_is_detected_as_a_rating_question(): void
    {
        $questions = $this->extractQuestionsFromLines([
            'How would you rate our communication?',
            'How satisfied were you overall, from 1 to 5?',
        ]);

        $this->assertSame('rating', $questions[0]['type']);
        $this->assertSame('rating', $questions[1]['type']);
    }

    public function test_bulleted_lines_after_a_question_become_choice_options(): void
    {
        $questions = $this->extractQuestionsFromLines([
            'How did you hear about us?',
            '- Instagram',
            '- Referral',
            '- Google Search',
            'Would you work with us again?',
        ]);

        $this->assertCount(2, $questions);
        $this->assertSame('choice', $questions[0]['type']);
        $this->assertSame(['Instagram', 'Referral', 'Google Search'], $questions[0]['options']);
        $this->assertSame('text', $questions[1]['type']);
        $this->assertSame([], $questions[1]['options']);
    }

    public function test_a_single_option_like_line_is_not_enough_to_become_a_choice_question(): void
    {
        $questions = $this->extractQuestionsFromLines([
            'What was the project about?',
            '- A website redesign',
        ]);

        $this->assertSame('text', $questions[0]['type']);
        $this->assertSame([], $questions[0]['options']);
    }

    public function test_lines_with_no_question_marks_produce_no_questions(): void
    {
        $questions = $this->extractQuestionsFromLines([
            'Thank you for choosing Bellah Options.',
            'We appreciate your business.',
        ]);

        $this->assertSame([], $questions);
    }

    public function test_csv_with_header_row_maps_columns_by_name(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'qcsv');
        file_put_contents($path, "type,question,options\nrating,How satisfied were you?,\nchoice,How did you hear about us?,Instagram;Referral;Google\ntext,Any comments?,\n");

        $questions = (new QuestionImportParser())->parseCsv($path);
        unlink($path);

        $this->assertCount(3, $questions);
        $this->assertSame('How satisfied were you?', $questions[0]['label']);
        $this->assertSame('rating', $questions[0]['type']);
        $this->assertSame('How did you hear about us?', $questions[1]['label']);
        $this->assertSame('choice', $questions[1]['type']);
        $this->assertSame(['Instagram', 'Referral', 'Google'], $questions[1]['options']);
        $this->assertSame('text', $questions[2]['type']);
    }

    public function test_csv_without_a_recognizable_header_assumes_fixed_column_order(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'qcsv');
        file_put_contents($path, "How satisfied were you?,rating,\nAny comments?,text,\n");

        $questions = (new QuestionImportParser())->parseCsv($path);
        unlink($path);

        $this->assertCount(2, $questions);
        $this->assertSame('How satisfied were you?', $questions[0]['label']);
        $this->assertSame('rating', $questions[0]['type']);
    }

    public function test_csv_defaults_an_unrecognized_type_to_text(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'qcsv');
        file_put_contents($path, "question,type\nHow was it?,banana\n");

        $questions = (new QuestionImportParser())->parseCsv($path);
        unlink($path);

        $this->assertSame('text', $questions[0]['type']);
    }

    public function test_empty_csv_throws(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'qcsv');
        file_put_contents($path, '');

        $this->expectException(RuntimeException::class);

        try {
            (new QuestionImportParser())->parseCsv($path);
        } finally {
            unlink($path);
        }
    }
}
