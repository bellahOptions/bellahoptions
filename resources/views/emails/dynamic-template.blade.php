@extends('emails.layouts.base')

@section('title', $emailTemplateName ?? 'Bellah Options')

@section('preheader', $emailTemplatePreheader ?? 'A message from Bellah Options')

@section('brand-tagline', $emailTemplateTagline ?? 'Creative &amp; digital delivery')

@section('content')
    {{--
        Admin-authored body from the Email Center.

        This arrives as a trusted HTML fragment: the builder produces inline-styled
        markup and `EmailTemplateComposer` escapes every substituted field. It is
        therefore emitted verbatim, but now inside the shared layout rather than
        the previous bare white box — so a custom template inherits the brand
        header, the rasterised logo and the legal footer instead of looking like a
        different company's mail.
    --}}
    {!! $htmlBody !!}
@endsection
